"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet as WalletIcon, Check, ChevronRight, Copy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function CypherWalletButton() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close the modal once a wallet successfully connects
  useEffect(() => {
    if (wallet.connected) setOpen(false);
  }, [wallet.connected]);

  function shortAddr(addr: string) {
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  }

  async function copyAddress() {
    if (!wallet.publicKey) return;
    await navigator.clipboard.writeText(wallet.publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function disconnect() {
    wallet.disconnect();
  }

  // Connected state — show address pill, opens a small menu
  if (wallet.connected && wallet.publicKey) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-medium border border-border hover:border-foreground/40 transition-colors bg-background"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--cypher-accent)" }}
          />
          <span className="font-mono">
            {shortAddr(wallet.publicKey.toBase58())}
          </span>
        </button>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Connected</DialogTitle>
            <DialogDescription>
              Wallet linked. You can now request attestations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <span className="text-xs text-muted-foreground">Address</span>
              <span className="font-mono text-xs">
                {shortAddr(wallet.publicKey.toBase58())}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={copyAddress}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy address"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-rose-600 hover:text-rose-700 hover:border-rose-300"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Disconnected state — show Connect button, opens wallet picker
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        size="default"
        className="gap-2 h-10 font-medium"
        style={{
          backgroundColor: "var(--cypher-accent)",
          color: "var(--cypher-accent-fg)",
        }}
      >
        <WalletIcon className="h-4 w-4" />
        Connect Wallet
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
          <DialogDescription>
            Choose a Solana wallet to verify with Cypher.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 pt-2">
          {wallet.wallets.map((w) => {
            const status = w.readyState;
            const installed =
              status === "Installed" || status === "Loadable";
            return (
              <button
                key={w.adapter.name}
                type="button"
                disabled={!installed}
                onClick={() => {
                  wallet.select(w.adapter.name);
                  // The adapter will auto-connect after select
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-foreground/40 hover:bg-accent transition-colors disabled:opacity-50 disabled:hover:border-border disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={w.adapter.icon}
                    alt={w.adapter.name}
                    className="w-7 h-7 rounded-md"
                  />
                  <span className="text-sm font-medium">
                    {w.adapter.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {installed ? "Detected" : "Not installed"}
                </span>
              </button>
            );
          })}
          {wallet.wallets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No Solana wallets detected. Install Phantom or Solflare to continue.
            </p>
          )}
        </div>
        <div className="pt-2 text-xs text-muted-foreground border-t border-border">
          New to Solana?{" "}
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
            style={{ color: "var(--cypher-accent)" }}
          >
            Get a wallet →
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
