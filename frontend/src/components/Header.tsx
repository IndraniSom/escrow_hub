"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletContext } from "@/context/WalletProvider";

export function Header() {
  const wallet = useWalletContext();
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#09090b] border-struct-b px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-4">
          <div className="w-8 h-8 bg-orange-600 flex items-center justify-center font-bold text-white">
            <span className="font-display">E</span>
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-white uppercase tracking-widest">
            Escrow<span className="text-orange-600">Hub</span>
          </span>
        </Link>
      </div>
      <nav className="hidden md:flex gap-8 text-sm uppercase tracking-widest text-[#a1a1aa]">
        <Link href="/" className="hover:text-white transition-colors hover:bg-[#27272a] px-2 py-1">How It Works</Link>
        <Link href="/projects" className="hover:text-white transition-colors hover:bg-[#27272a] px-2 py-1">Find Work</Link>
        {wallet.status !== "connected" && (
          <Link href="/onboarding" className="hover:text-white transition-colors hover:bg-[#27272a] px-2 py-1">Sign Up</Link>
        )}
      </nav>
      <div className="flex items-center gap-4">
        {wallet.status !== "connected" && (
          <Link href="/sign-in" className="text-sm uppercase tracking-widest text-[#a1a1aa] hover:text-white transition-colors hidden md:block">
            Sign In
          </Link>
        )}
        <Link href="/dashboard" className="btn-primary">
          {wallet.status === "connected" ? "Dashboard" : "Open App"}
        </Link>
      </div>
    </header>
  );
}
