"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ChevronLeft } from "lucide-react";

export type SceneTheme = {
  brandName: string;
  tagline: string;
  bg: string;        // e.g. "bg-emerald-50"
  surface: string;   // e.g. "bg-white"
  ink: string;       // e.g. "text-emerald-950"
  muted: string;     // e.g. "text-emerald-700/70"
  accent: string;    // hex, used inside AttestationGate
};

export function SceneShell({
  theme,
  children,
}: {
  theme: SceneTheme;
  children: ReactNode;
}) {
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.ink}`}>
      <header className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm flex items-center gap-1 ${theme.muted} hover:${theme.ink}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Cypher
          </Link>
          <div className={`text-sm ${theme.muted}`}>·</div>
          <div className="font-semibold tracking-tight">{theme.brandName}</div>
          <div className={`text-xs ${theme.muted} hidden sm:block`}>
            {theme.tagline}
          </div>
        </div>
        <WalletMultiButton />
      </header>
      <div className="px-8 py-6 max-w-5xl mx-auto">{children}</div>
    </div>
  );
}
