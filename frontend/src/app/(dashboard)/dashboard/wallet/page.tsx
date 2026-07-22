"use client";

import { useState, useEffect } from "react";
import { Wallet, Copy, ArrowUpRight, ArrowDownLeft, Activity, Globe, ShieldCheck } from "lucide-react";
import { getApiClient } from "@/lib/api";
import type { Transaction } from "@/lib/types";

export default function WalletPage() {
  const api = getApiClient();
  const [balance, setBalance] = useState("0");
  const [locked, setLocked] = useState("0");
  const [released, setReleased] = useState("0");
  const [activeContracts, setActiveContracts] = useState(0);
  const [xlmBalance, setXlmBalance] = useState("0");
  const [stellarAddress, setStellarAddress] = useState("");
  const [transactions, setTransactions] = useState<{ type: string; description: string; hash: string; amount: string; positive: boolean }[]>([]);

  const shortAddress = stellarAddress.length > 12 ? `${stellarAddress.slice(0, 5)}...${stellarAddress.slice(-4)}` : stellarAddress;

  useEffect(() => {
    async function load() {
      try {
        const [me, balRes, txRes, projectsRes] = await Promise.all([
          api.auth.me(),
          api.wallet.balance(),
          api.wallet.transactions({ limit: 10 }),
          api.projects.list({ limit: 100 }),
        ]);
        setStellarAddress(me.stellarAddress);
        setBalance(balRes.balance.toString());
        setXlmBalance("0");

        const activeCount = projectsRes.data.filter((p: { status: string }) => ["FUNDED", "IN_PROGRESS"].includes(p.status)).length;
        setActiveContracts(activeCount);

        const totalLocked = projectsRes.data.reduce((sum: number, p: { escrowAmount: string; status: string }) =>
          ["FUNDED", "IN_PROGRESS"].includes(p.status) ? sum + Number(p.escrowAmount || 0) : sum, 0
        );
        setLocked(totalLocked.toLocaleString());
        setReleased(balRes.balance.toString());

        setTransactions(
          (txRes.data || []).map((tx: Transaction) => ({
            type: tx.type === "payment" || tx.type === "release" ? "Release" : "Fund",
            description: tx.description || "N/A",
            hash: tx.stellarTxHash ? `${tx.stellarTxHash.slice(0, 6)}...${tx.stellarTxHash.slice(-4)}` : "",
            amount: tx.type === "payment" || tx.type === "release" ? `+${Number(tx.amount).toLocaleString()}` : `-${Number(tx.amount).toLocaleString()}`,
            positive: tx.type === "payment" || tx.type === "release",
          }))
        );
      } catch {}
    }
    load();
  }, [api]);

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span className="text-xs text-green-500 font-medium">Wallet Active</span>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-white flex items-center gap-3 tracking-tight">
            <Wallet className="w-8 h-8 text-white/50" />
            Wallet Overview
          </h1>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 md:p-12 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row gap-12 justify-between">
          <div className="space-y-6 flex-1">
            <p className="text-sm font-medium text-[#a1a1aa]">Total Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl text-white/50 font-light">$</span>
              <span className="text-6xl md:text-8xl font-bold text-white tracking-tighter">{Number(balance).toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-4 md:min-w-[320px]">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-medium text-[#a1a1aa]">Wallet Address</p>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-mono text-white truncate">{shortAddress}</p>
                <button className="text-[#a1a1aa] hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg shrink-0" onClick={() => navigator.clipboard.writeText(stellarAddress)}>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex justify-between items-center">
              <p className="text-xs font-medium text-[#a1a1aa]">Available XLM</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold text-white">{Number(xlmBalance).toFixed(2)}</span>
                <span className="text-xs text-[#71717a]">XLM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl border border-white/5 bg-[#09090b] hover:bg-[#111113] transition-colors">
          <span className="text-sm text-[#a1a1aa] mb-3 block">Currently Locked</span>
          <span className="text-3xl font-semibold text-white">${locked}</span>
        </div>
        <div className="p-8 rounded-3xl border border-white/5 bg-[#09090b] hover:bg-[#111113] transition-colors">
          <span className="text-sm text-[#a1a1aa] mb-3 block">Total Released</span>
          <span className="text-3xl font-semibold text-[#22c55e]">${Number(released).toLocaleString()}</span>
        </div>
        <div className="p-8 rounded-3xl border border-white/5 bg-[#09090b] hover:bg-[#111113] transition-colors">
          <span className="text-sm text-[#a1a1aa] mb-3 block">Active Contracts</span>
          <span className="text-3xl font-semibold text-white">{activeContracts}</span>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-white/50" />
          Recent Activity
        </h2>
        <div className="rounded-3xl border border-white/5 bg-[#09090b] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 text-xs font-medium text-[#71717a] bg-[#111113]">
            <div className="col-span-4 md:col-span-3 lg:col-span-2">Type</div>
            <div className="col-span-4 md:col-span-4">Description</div>
            <div className="hidden lg:block col-span-3">Hash</div>
            <div className="col-span-4 md:col-span-5 lg:col-span-3 text-right">Amount</div>
          </div>
          <div className="divide-y divide-white/5">
            {transactions.length === 0 && (
              <div className="px-8 py-12 text-center text-sm text-[#52525b]">No transactions yet</div>
            )}
            {transactions.map((tx, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/5 transition-colors cursor-pointer">
                <div className="col-span-4 md:col-span-3 lg:col-span-2 flex items-center gap-4">
                  <div className={`p-2 rounded-full ${tx.positive ? "bg-green-500/10 text-green-500" : "bg-white/10 text-white"}`}>
                    {tx.positive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-white">{tx.type}</span>
                </div>
                <div className="col-span-4 md:col-span-4">
                  <p className="text-sm text-white/80">{tx.description}</p>
                </div>
                <div className="hidden lg:block col-span-3">
                  <p className="text-sm font-mono text-[#71717a]">{tx.hash}</p>
                </div>
                <div className="col-span-4 md:col-span-5 lg:col-span-3 text-right">
                  <span className={`font-semibold text-base ${tx.positive ? "text-green-500" : "text-white"}`}>
                    {tx.amount} <span className="text-xs ml-1 text-[#71717a] font-normal">USDC</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
