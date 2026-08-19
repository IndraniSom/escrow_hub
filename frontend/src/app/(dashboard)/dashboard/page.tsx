"use client";

import { useCallback } from "react";
import { getApiClient } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { AsyncState } from "@/components/ui/async-state";
import type { Transaction } from "@/lib/types";

interface DashboardData {
  escrowTotal: string;
  activeProjects: number;
  completedMilestones: number;
  transactions: { type: string; projectName: string; txHash: string; amount: string }[];
}

export default function DashboardPage() {
  const api = getApiClient();

  const load = useCallback(async (): Promise<DashboardData> => {
    const [projectsRes, txRes] = await Promise.all([
      api.projects.list({ limit: 100 }),
      api.wallet.transactions({ limit: 10 }),
    ]);
    const activeCount = projectsRes.data.filter((p: { status: string }) => ["FUNDED", "IN_PROGRESS"].includes(p.status)).length;
    const totalEscrow = projectsRes.data.reduce((sum: number, p: { escrowAmount: string }) => sum + Number(p.escrowAmount || 0), 0);
    const transactions = (txRes.data || []).slice(0, 5).map((tx: Transaction) => ({
      type: tx.type,
      projectName: tx.description || "N/A",
      txHash: tx.stellarTxHash || "",
      amount: tx.amount,
    }));
    return {
      escrowTotal: totalEscrow.toLocaleString(),
      activeProjects: activeCount,
      completedMilestones: projectsRes.data.filter((p: { status: string }) => p.status === "COMPLETED").length,
      transactions,
    };
  }, [api]);

  const { data, status, error, retry } = useAsync(load, [api]);

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      <header className="border-struct-b pb-8">
        <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white">Dashboard</h1>
        <p className="text-[#a1a1aa] mt-2 font-mono text-sm uppercase tracking-widest">Your Account Overview</p>
      </header>

      <AsyncState status={status} onRetry={retry} errorMessage={error ?? undefined}>
      {data && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-3 border-struct">
        <div className="p-8 border-struct-b md:border-struct-b-0 md:border-struct-r bg-[#09090b]">
          <h3 className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">Total Funds in Escrow</h3>
          <p className="text-4xl font-display font-black text-white">${data.escrowTotal} <span className="text-lg text-[#a1a1aa] font-mono tracking-widest">USDC</span></p>
        </div>
        <div className="p-8 border-struct-b md:border-struct-b-0 md:border-struct-r bg-[#09090b]">
          <h3 className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">Active Projects</h3>
          <p className="text-4xl font-display font-black text-white">{String(data.activeProjects).padStart(2, "0")}</p>
        </div>
        <div className="p-8 bg-[#09090b]">
          <h3 className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">Completed Milestones</h3>
          <p className="text-4xl font-display font-black text-white">{String(data.completedMilestones).padStart(2, "0")}</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-display font-black uppercase text-white mb-6">Recent Activity</h2>
        <div className="border-struct bg-[#09090b]">
          <div className="grid grid-cols-12 gap-4 p-4 border-struct-b text-xs uppercase tracking-widest text-[#a1a1aa] font-bold">
            <div className="col-span-3">Action</div>
            <div className="col-span-6">Project Name</div>
            <div className="col-span-3 text-right">Amount</div>
          </div>

          {data.transactions.length === 0 && (
            <div className="p-8 text-center text-sm text-[#52525b]">No recent activity</div>
          )}
          {data.transactions.map((tx, i) => (
            <div key={i} className={`grid grid-cols-12 gap-4 p-4 ${i < data.transactions.length - 1 ? "border-struct-b" : ""} items-center hover:bg-[#111113] transition-colors`}>
              <div className="col-span-3">
                <span className={`px-2 py-1 text-xs uppercase tracking-widest font-bold ${tx.type === "payment" || tx.type === "release" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}`}>
                  {tx.type === "payment" || tx.type === "release" ? "Paid Out" : "Funded"}
                </span>
              </div>
              <div className="col-span-6">
                <p className="text-white font-bold text-sm">{tx.projectName}</p>
                {tx.txHash && <p className="text-xs text-[#a1a1aa]">Transaction: {tx.txHash.slice(0, 10)}...</p>}
              </div>
              <div className="col-span-3 text-right font-bold">
                {tx.type === "payment" || tx.type === "release" ? "+" : "-"}${tx.amount} USDC
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
      </AsyncState>
    </div>
  );
}
