"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { CypherWalletButton } from "@/components/cypher-wallet-button";
import { ChevronLeft } from "lucide-react";
import { CypherLogo } from "./cypher-logo";

export type SceneTheme = {
  brandName: string;
  tagline: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  accentText: string;
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
      <header
        className={`px-6 md:px-10 py-4 flex items-center justify-between border-b ${theme.border} sticky top-0 backdrop-blur z-50`}
        style={{
          backgroundColor: "rgb(from currentColor r g b / 0)",
        }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${theme.muted} hover:opacity-80 transition-opacity`}
            aria-label="Back to Cypher"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
              <CypherLogo size="sm" asLink={false} />
          </Link>
          <div className={`h-5 w-px ${theme.border}`} />
          <div className="flex items-baseline gap-3">
            <span className="font-semibold tracking-tight text-base">
              {theme.brandName}
            </span>
            <span className={`text-xs ${theme.muted} hidden md:inline`}>
              {theme.tagline}
            </span>
          </div>
        </div>
        <CypherWalletButton />
      </header>
      <div className="px-6 md:px-10 py-12 md:py-16 max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}