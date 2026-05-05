use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::access_control::instructions::{
    CommitAndUndelegatePermissionCpiBuilder, CreatePermissionCpiBuilder,
    DelegatePermissionCpiBuilder, UpdatePermissionCpiBuilder,
};
use ephemeral_rollups_sdk::access_control::structs::{Member, MembersArgs, PERMISSION_SEED};
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::consts::PERMISSION_PROGRAM_ID;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;

declare_id!("4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC");

pub const REPUTATION_SEED: &[u8] = b"reputation";

pub const EV_PAYMENT_COMPLETED: u8 = 0;
pub const EV_PAYMENT_FAILED: u8 = 1;
pub const EV_PAYMENT_DISPUTED: u8 = 2;
pub const EV_LOAN_ON_TIME: u8 = 3;
pub const EV_LOAN_LATE: u8 = 4;
pub const EV_LOAN_DEFAULTED: u8 = 5;
pub const EV_VOLUME: u8 = 6;

pub const DIM_PAYMENT: u8 = 0;
pub const DIM_CREDIT: u8 = 1;
pub const DIM_VOLUME: u8 = 2;

pub const TIER_1_MAX: u64 = 1_000;
pub const TIER_2_MAX: u64 = 10_000;
pub const TIER_3_MAX: u64 = 100_000;

pub const SCORE_SMOOTHING: u64 = 5;
pub const SCORE_MAX: u64 = 10;
pub const VOLUME_BUCKETS: usize = 30;
pub const SECONDS_PER_DAY: i64 = 86_400;

#[ephemeral]
#[program]
pub mod cypher {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, recorder_authority: Pubkey) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        rep.agent = ctx.accounts.agent.key();
        rep.recorder_authority = recorder_authority;
        rep.pay_completed = 0;
        rep.pay_failed = 0;
        rep.pay_disputed = 0;
        rep.credit_on_time = 0;
        rep.credit_late = 0;
        rep.credit_defaulted = 0;
        rep.volume_buckets = [0u64; VOLUME_BUCKETS];
        rep.bucket_head = 0;
        rep.bucket_head_day = 0;
        rep.bump = ctx.bumps.reputation;
        msg!("Initialized reputation for agent {}", rep.agent);
        Ok(())
    }

    pub fn record_event(
        ctx: Context<RecordEvent>,
        event_type: u8,
        amount: u64,
    ) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        match event_type {
            EV_PAYMENT_COMPLETED => rep.pay_completed = rep.pay_completed.saturating_add(1),
            EV_PAYMENT_FAILED => rep.pay_failed = rep.pay_failed.saturating_add(1),
            EV_PAYMENT_DISPUTED => rep.pay_disputed = rep.pay_disputed.saturating_add(1),
            EV_LOAN_ON_TIME => rep.credit_on_time = rep.credit_on_time.saturating_add(1),
            EV_LOAN_LATE => rep.credit_late = rep.credit_late.saturating_add(1),
            EV_LOAN_DEFAULTED => rep.credit_defaulted = rep.credit_defaulted.saturating_add(1),
            EV_VOLUME => {
                let now = Clock::get()?.unix_timestamp;
                let today = (now / SECONDS_PER_DAY) as u32;
                advance_bucket_head(rep, today);
                let head = rep.bucket_head as usize;
                rep.volume_buckets[head] = rep.volume_buckets[head].saturating_add(amount);
            }
            _ => return Err(error!(CypherError::InvalidEventType)),
        }
        msg!("Recorded event {} (amount={})", event_type, amount);
        Ok(())
    }

    pub fn issue_attestation(
        ctx: Context<IssueAttestation>,
        dimension: u8,
        threshold: u64,
    ) -> Result<()> {
        let rep = &ctx.accounts.reputation;
        let score = match dimension {
            DIM_PAYMENT => calc_payment_score(rep),
            DIM_CREDIT => calc_credit_score(rep),
            DIM_VOLUME => calc_volume_tier(rep) as u64,
            _ => return Err(error!(CypherError::InvalidDimension)),
        };
        let passes = score >= threshold;
        emit!(AttestationEvent {
            agent: rep.agent,
            dimension,
            threshold,
            score,
            passes,
            timestamp: Clock::get()?.unix_timestamp,
        });
        msg!(
            "Attestation: agent={} dim={} score={} threshold={} passes={}",
            rep.agent, dimension, score, threshold, passes
        );
        Ok(())
    }

    pub fn delegate(
        ctx: Context<DelegateReputation>,
        members: Option<Vec<Member>>,
    ) -> Result<()> {
        let validator = ctx.accounts.validator.as_ref();
        let agent_key = ctx.accounts.payer.key();
        let bump = ctx.bumps.reputation;

        if ctx.accounts.permission.data_is_empty() {
            CreatePermissionCpiBuilder::new(&ctx.accounts.permission_program)
                .permissioned_account(&ctx.accounts.reputation.to_account_info())
                .permission(&ctx.accounts.permission.to_account_info())
                .payer(&ctx.accounts.payer.to_account_info())
                .system_program(&ctx.accounts.system_program.to_account_info())
                .args(MembersArgs { members })
                .invoke_signed(&[&[REPUTATION_SEED, agent_key.as_ref(), &[bump]]])?;
        } else {
            UpdatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
                .authority(&ctx.accounts.payer.to_account_info(), true)
                .permissioned_account(&ctx.accounts.reputation.to_account_info(), true)
                .permission(&ctx.accounts.permission.to_account_info())
                .args(MembersArgs { members })
                .invoke_signed(&[&[REPUTATION_SEED, agent_key.as_ref(), &[bump]]])?;
        }

        if ctx.accounts.permission.owner != &ephemeral_rollups_sdk::id() {
            DelegatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
                .permissioned_account(&ctx.accounts.reputation.to_account_info(), true)
                .permission(&ctx.accounts.permission.to_account_info())
                .payer(&ctx.accounts.payer.to_account_info())
                .authority(&ctx.accounts.reputation.to_account_info(), false)
                .system_program(&ctx.accounts.system_program.to_account_info())
                .owner_program(&ctx.accounts.permission_program.to_account_info())
                .delegation_buffer(&ctx.accounts.buffer_permission.to_account_info())
                .delegation_metadata(&ctx.accounts.delegation_metadata_permission.to_account_info())
                .delegation_record(&ctx.accounts.delegation_record_permission.to_account_info())
                .delegation_program(&ctx.accounts.delegation_program.to_account_info())
                .validator(validator)
                .invoke_signed(&[&[REPUTATION_SEED, agent_key.as_ref(), &[bump]]])?;
        }

        if ctx.accounts.reputation.owner != &ephemeral_rollups_sdk::id() {
            ctx.accounts.delegate_reputation(
                &ctx.accounts.payer,
                &[REPUTATION_SEED, agent_key.as_ref()],
                DelegateConfig {
                    validator: validator.map(|v| v.key()),
                    ..Default::default()
                },
            )?;
        }
        Ok(())
    }

    pub fn undelegate(ctx: Context<UndelegateReputation>) -> Result<()> {
    let agent_key = ctx.accounts.payer.key();
    let bump = ctx.bumps.reputation;

        CommitAndUndelegatePermissionCpiBuilder::new(
            &ctx.accounts.permission_program.to_account_info(),
        )
        .authority(&ctx.accounts.payer.to_account_info(), true)
        .permissioned_account(&ctx.accounts.reputation.to_account_info(), true)
        .permission(&ctx.accounts.permission.to_account_info())
        .magic_context(&ctx.accounts.magic_context.to_account_info())
        .magic_program(&ctx.accounts.magic_program.to_account_info())
        .invoke_signed(&[&[REPUTATION_SEED, agent_key.as_ref(), &[bump]]])?;

        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit_and_undelegate(&[ctx.accounts.reputation.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }
}

fn calc_payment_score(rep: &AgentReputation) -> u64 {
    let raw: i64 = (rep.pay_completed as i64) * 10
        - (rep.pay_failed as i64) * 20
        - (rep.pay_disputed as i64) * 15;
    let positives_x10 = rep.pay_completed.saturating_mul(10);
    let total = rep
        .pay_completed
        .saturating_add(rep.pay_failed)
        .saturating_add(rep.pay_disputed);
    normalize(raw, positives_x10, total)
}

fn calc_credit_score(rep: &AgentReputation) -> u64 {
    let raw: i64 = (rep.credit_on_time as i64) * 10
        - (rep.credit_late as i64) * 5
        - (rep.credit_defaulted as i64) * 30;
    let positives_x10 = rep.credit_on_time.saturating_mul(10);
    let total = rep
        .credit_on_time
        .saturating_add(rep.credit_late)
        .saturating_add(rep.credit_defaulted);
    normalize(raw, positives_x10, total)
}

fn calc_volume_tier(rep: &AgentReputation) -> u8 {
    let total: u64 = rep.volume_buckets.iter().sum();
    if total <= TIER_1_MAX {
        1
    } else if total <= TIER_2_MAX {
        2
    } else if total <= TIER_3_MAX {
        3
    } else {
        4
    }
}

fn normalize(raw: i64, positives_x10: u64, total_events: u64) -> u64 {
    if raw <= 0 {
        return 0;
    }
    let denom = total_events.saturating_add(SCORE_SMOOTHING);
    if denom == 0 {
        return 0;
    }
    let score = positives_x10 / denom;
    score.min(SCORE_MAX)
}

fn advance_bucket_head(rep: &mut AgentReputation, today: u32) {
    if rep.bucket_head_day == 0 {
        rep.bucket_head_day = today;
        return;
    }
    if today == rep.bucket_head_day {
        return;
    }
    let days_elapsed = today.saturating_sub(rep.bucket_head_day) as usize;
    let steps = days_elapsed.min(VOLUME_BUCKETS);
    for _ in 0..steps {
        rep.bucket_head = ((rep.bucket_head as usize + 1) % VOLUME_BUCKETS) as u8;
        rep.volume_buckets[rep.bucket_head as usize] = 0;
    }
    rep.bucket_head_day = today;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = agent,
        space = AgentReputation::LEN,
        seeds = [REPUTATION_SEED, agent.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, AgentReputation>,
    #[account(mut)]
    pub agent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordEvent<'info> {
    #[account(
        mut,
        seeds = [REPUTATION_SEED, reputation.agent.as_ref()],
        bump = reputation.bump,
        has_one = recorder_authority,
    )]
    pub reputation: Account<'info, AgentReputation>,
    pub recorder_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct IssueAttestation<'info> {
    #[account(
        seeds = [REPUTATION_SEED, reputation.agent.as_ref()],
        bump = reputation.bump,
    )]
    pub reputation: Account<'info, AgentReputation>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateReputation<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: PDA delegated to ER
    #[account(mut, del, seeds = [REPUTATION_SEED, payer.key().as_ref()], bump)]
    pub reputation: AccountInfo<'info>,
    /// CHECK: Permission PDA, derived by the permission program
    #[account(mut, seeds = [PERMISSION_SEED, reputation.key().as_ref()], bump, seeds::program = permission_program.key())]
    pub permission: AccountInfo<'info>,
    /// CHECK: Buffer for permission delegation
    #[account(mut, seeds = [ephemeral_rollups_sdk::pda::DELEGATE_BUFFER_TAG, permission.key().as_ref()], bump, seeds::program = PERMISSION_PROGRAM_ID)]
    pub buffer_permission: AccountInfo<'info>,
    /// CHECK: Delegation record for permission
    #[account(mut, seeds = [ephemeral_rollups_sdk::pda::DELEGATION_RECORD_TAG, permission.key().as_ref()], bump, seeds::program = ephemeral_rollups_sdk::id())]
    pub delegation_record_permission: AccountInfo<'info>,
    /// CHECK: Delegation metadata for permission
    #[account(mut, seeds = [ephemeral_rollups_sdk::pda::DELEGATION_METADATA_TAG, permission.key().as_ref()], bump, seeds::program = ephemeral_rollups_sdk::id())]
    pub delegation_metadata_permission: AccountInfo<'info>,
    /// CHECK: Permission Program
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Validator pubkey
    pub validator: Option<AccountInfo<'info>>,
}

#[commit]
#[derive(Accounts)]
pub struct UndelegateReputation<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [REPUTATION_SEED, payer.key().as_ref()], bump)]
    pub reputation: Account<'info, AgentReputation>,
    /// CHECK: permission PDA
    #[account(mut, seeds = [PERMISSION_SEED, reputation.key().as_ref()], bump, seeds::program = permission_program.key())]
    pub permission: AccountInfo<'info>,
    /// CHECK: Permission Program
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,
}

#[account]
pub struct AgentReputation {
    pub agent: Pubkey,
    pub recorder_authority: Pubkey,
    pub pay_completed: u64,
    pub pay_failed: u64,
    pub pay_disputed: u64,
    pub credit_on_time: u64,
    pub credit_late: u64,
    pub credit_defaulted: u64,
    pub volume_buckets: [u64; VOLUME_BUCKETS],
    pub bucket_head: u8,
    pub bucket_head_day: u32,
    pub bump: u8,
}

impl AgentReputation {
    pub const LEN: usize = 8
        + 32
        + 32
        + 8 * 6
        + 8 * VOLUME_BUCKETS
        + 1
        + 4
        + 1;
}

#[event]
pub struct AttestationEvent {
    pub agent: Pubkey,
    pub dimension: u8,
    pub threshold: u64,
    pub score: u64,
    pub passes: bool,
    pub timestamp: i64,
}

#[error_code]
pub enum CypherError {
    #[msg("Invalid event type")]
    InvalidEventType,
    #[msg("Invalid dimension")]
    InvalidDimension,
}