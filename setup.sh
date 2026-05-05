#!/bin/bash
nvm use 20.18.1
export ANCHOR_WALLET=$HOME/.config/solana/id.json
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
echo "Cypher dev env loaded"
echo "  Node:   $(node --version)"
echo "  Wallet: $ANCHOR_WALLET"
echo "  RPC:    $ANCHOR_PROVIDER_URL"
