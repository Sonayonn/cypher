import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CypherWalletProvider } from "@/components/wallet-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cypher · Privacy-first reputation for AI agents on Solana",
  description:
    "The missing primitive for the agent economy. Three reputation dimensions, one private vault, every market unlocked. Built on MagicBlock's Private Ephemeral Rollup.",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/cypher-mark.svg",
  },
  openGraph: {
    title: "Cypher",
    description:
      "Privacy-first reputation layer for AI agents on Solana. The missing primitive for the agent economy.",
    type: "website",
    url:"https://cypher-devnet.vercel.app/"
  },
  twitter: {
    card: "summary",
    title: "Cypher",
    description:
      "Privacy-first reputation layer for AI agents on Solana.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CypherWalletProvider>{children}</CypherWalletProvider>
      </body>
    </html>
  );
}
