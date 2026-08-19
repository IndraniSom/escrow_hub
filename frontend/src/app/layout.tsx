import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Freelance Escrow Hub",
  description: "A secure freelancing platform where payments are locked in escrow and released automatically.",
};

import { WalletProvider } from "@/context/WalletProvider";
import { Header } from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${jetbrains.variable} antialiased min-h-screen flex flex-col`}>
        <div className="noise-overlay"></div>
        <WalletProvider>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </WalletProvider>
        <footer className="border-struct-b border-t border-[#27272a] px-8 py-8 mt-auto flex justify-between text-xs text-[#a1a1aa] uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Freelance Escrow Hub.</p>
          <p>Powered by Stellar & Soroban</p>
        </footer>
      </body>
    </html>
  );
}
