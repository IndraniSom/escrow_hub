"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { Role } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const api = getApiClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.auth.me().then((me) => setUserId(me.id)).catch(() => {});
  }, [api]);

  async function chooseRole(role: Role.CLIENT | Role.FREELANCER) {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await api.users.update(userId, { role, isOnboarded: true });
      router.push("/dashboard");
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Failed to save role");
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto py-16 px-8">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight text-white mb-6">
          Welcome: <br />
          <span className="text-orange-600">Choose Your Path</span>
        </h1>
        <p className="text-[#a1a1aa] max-w-2xl text-sm border-l-2 border-orange-600 pl-4">
          How do you want to use Freelance Escrow Hub? Tell us if you are looking to hire talent or if you are a freelancer looking for work.
        </p>
        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-struct">

        {/* Client Path */}
        <div className="p-8 md:p-12 border-struct-b md:border-struct-b-0 md:border-struct-r hover:bg-[#111113] transition-colors group">
          <div className="text-orange-600 font-bold text-lg mb-8 block">ROLE // CLIENT</div>
          <h2 className="text-3xl font-display font-black uppercase mb-4 text-white">I want to hire</h2>
          <p className="text-[#a1a1aa] text-sm mb-12 h-16">
            Create new projects, fund them securely, and automatically release payments when you approve the work.
          </p>
          <ul className="space-y-4 mb-12 text-xs uppercase tracking-widest text-gray-500">
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-orange-600 rounded-none"></span> Requires Crypto Wallet</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-orange-600 rounded-none"></span> Deposit funds to Escrow</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-orange-600 rounded-none"></span> Review & Approve Work</li>
          </ul>
          <button onClick={() => chooseRole(Role.CLIENT)} disabled={saving} className="btn-outline block w-full text-center group-hover:bg-white group-hover:text-black group-hover:border-white disabled:opacity-50">
            {saving ? "Saving..." : "Continue as Client"}
          </button>
        </div>

        {/* Freelancer Path */}
        <div className="p-8 md:p-12 hover:bg-[#111113] transition-colors group">
          <div className="text-orange-600 font-bold text-lg mb-8 block">ROLE // FREELANCER</div>
          <h2 className="text-3xl font-display font-black uppercase mb-4 text-white">I want to work</h2>
          <p className="text-[#a1a1aa] text-sm mb-12 h-16">
            Find projects, complete milestones, and get paid instantly. You can even connect GitHub to automate payments when your code merges.
          </p>
          <ul className="space-y-4 mb-12 text-xs uppercase tracking-widest text-gray-500">
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-orange-600 rounded-none"></span> Requires Crypto Wallet</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-orange-600 rounded-none"></span> Connect GitHub Account</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-orange-600 rounded-none"></span> Receive Instant Payouts</li>
          </ul>
          <button onClick={() => chooseRole(Role.FREELANCER)} disabled={saving} className="btn-primary block w-full text-center disabled:opacity-50">
            {saving ? "Saving..." : "Continue as Freelancer"}
          </button>
        </div>

      </div>
    </div>
  );
}