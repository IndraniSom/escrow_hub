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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${jetbrains.variable} antialiased min-h-screen flex flex-col`}>
        <div className="noise-overlay"></div>
        <header className="sticky top-0 z-50 bg-[#09090b] border-struct-b px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-orange-600 flex items-center justify-center font-bold text-white">
              <span className="font-display">E</span>
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-white uppercase tracking-widest">
              Escrow<span className="text-orange-600">Hub</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm uppercase tracking-widest text-[#a1a1aa]">
            <Link href="/" className="hover:text-white transition-colors hover:bg-[#27272a] px-2 py-1">How It Works</Link>
            <Link href="/projects" className="hover:text-white transition-colors hover:bg-[#27272a] px-2 py-1">Find Work</Link>
            <Link href="/onboarding" className="hover:text-white transition-colors hover:bg-[#27272a] px-2 py-1">Sign Up</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm uppercase tracking-widest text-[#a1a1aa] hover:text-white transition-colors hidden md:block">
              Sign In
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Open App
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="border-struct-b border-t border-[#27272a] px-8 py-8 mt-auto flex justify-between text-xs text-[#a1a1aa] uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Freelance Escrow Hub.</p>
          <p>Powered by Stellar & Soroban</p>
        </footer>
      </body>
    </html>
  );
}
