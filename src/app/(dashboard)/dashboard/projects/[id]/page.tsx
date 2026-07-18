"use client";

import { useState } from "react";

type FundingState = "idle" | "authorizing" | "confirming" | "funded" | "error";

export default function ProjectDetailsPage() {
  const [fundingState, setFundingState] = useState<FundingState>("idle");
  const [fundAmount, setFundAmount] = useState("3000");

  async function handleFundEscrow() {
    setFundingState("authorizing");
    // Step 1: x402 payment authorization
    await new Promise((r) => setTimeout(r, 1500));
    setFundingState("confirming");
    // Step 2: Soroban contract submission
    await new Promise((r) => setTimeout(r, 2000));
    setFundingState("funded");
  }

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between border-struct-b pb-8 gap-6">
        <div>
          <div className="inline-block bg-orange-600/10 text-orange-600 px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
            Status: Active
          </div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white mb-2">
            DeFi Dashboard Frontend
          </h1>
          <p className="text-[#a1a1aa] font-mono text-sm uppercase tracking-widest">
            ID: PROJ-0001 // Contract: 0x8a92b...4f1c
          </p>
        </div>
        <div className="border-struct p-6 bg-[#09090b] min-w-[200px]">
          <p className="text-[10px] text-[#a1a1aa] uppercase tracking-widest font-bold mb-2">Funds in Escrow</p>
          <p className="text-3xl font-display font-black text-white">
            $3,000 <span className="text-sm font-mono text-[#a1a1aa]">USDC</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Milestones */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-display font-black uppercase text-white mb-6">Project Milestones</h2>
            <div className="border-struct bg-[#09090b]">
              {[
                { name: "Initial Setup & Layouts", amount: "$500", status: "Completed", tx: "0x3f1a...c4" },
                { name: "Dashboard Analytics UI", amount: "$1,000", status: "In Progress", tx: null },
                { name: "Smart Contract Integration", amount: "$1,500", status: "Pending", tx: null },
              ].map((m, i, arr) => (
                <div
                  key={i}
                  className={`p-6 ${i !== arr.length - 1 ? "border-struct-b" : ""} hover:bg-[#111113] transition-colors`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 ${m.status === "Completed" ? "bg-green-500" : m.status === "In Progress" ? "bg-orange-600" : "bg-[#3f3f46]"}`}
                        ></span>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#a1a1aa]">{m.status}</p>
                      </div>
                      <p className="font-bold uppercase tracking-wider text-white text-sm">{m.name}</p>
                      {m.tx && (
                        <p className="text-xs font-mono text-green-500">
                          Released — Tx: {m.tx}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-white">{m.amount}</span>
                      {m.status === "In Progress" && (
                        <button className="btn-primary text-xs py-2 px-4">Approve & Release</button>
                      )}
                      {m.status === "Pending" && (
                        <button className="btn-outline text-xs py-2 px-4 border-[#27272a]">View</button>
                      )}
                      {m.status === "Completed" && (
                        <span className="text-[10px] uppercase tracking-widest text-green-500 font-bold">✓ Paid</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs uppercase tracking-widest text-orange-600 hover:underline">
              + Add Milestone
            </button>
          </div>

          {/* Escrow Funding Panel */}
          <div className="border border-orange-600/30 bg-orange-600/5 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-display font-black uppercase text-white">Fund Escrow</h2>
              <p className="text-sm text-[#a1a1aa] mt-1">
                Add USDC to this project's escrow via Stellar x402 payment authorization.
              </p>
            </div>

            {fundingState === "idle" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-orange-600">
                    Amount (USDC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] font-mono">$</span>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="w-full bg-[#09090b] border-struct pl-7 py-3 pr-3 text-white font-mono text-sm focus:outline-none focus:border-orange-600"
                    />
                  </div>
                </div>
                <div className="border border-[#27272a] p-3 text-xs text-[#71717a] font-mono space-y-1">
                  <p>Protocol: x402 / Stellar</p>
                  <p>Asset: USDC (Stellar Testnet)</p>
                  <p>Facilitator: x402.org</p>
                  <p>Smart Contract: Soroban Escrow v1</p>
                </div>
                <button
                  onClick={handleFundEscrow}
                  className="w-full btn-primary py-3 text-sm"
                >
                  Authorize Payment via Freighter
                </button>
              </div>
            )}

            {fundingState === "authorizing" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-sm text-white font-bold">Step 1 of 2: Authorizing x402 payment...</p>
                </div>
                <p className="text-xs text-[#a1a1aa]">
                  Please confirm the transaction in your Freighter wallet.
                </p>
                <div className="w-full bg-[#27272a] h-1">
                  <div className="bg-orange-600 h-1 w-1/2 transition-all" />
                </div>
              </div>
            )}

            {fundingState === "confirming" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-sm text-white font-bold">Step 2 of 2: Submitting to Soroban...</p>
                </div>
                <p className="text-xs text-[#a1a1aa]">
                  The escrow contract is being funded on the Stellar network.
                </p>
                <div className="w-full bg-[#27272a] h-1">
                  <div className="bg-orange-600 h-1 w-full transition-all" />
                </div>
              </div>
            )}

            {fundingState === "funded" && (
              <div className="border border-green-500/30 bg-green-500/5 p-4 space-y-2">
                <p className="text-xs uppercase tracking-widest text-green-500 font-bold">✓ Escrow Funded Successfully</p>
                <p className="text-sm text-[#a1a1aa]">
                  ${fundAmount} USDC has been locked in the smart contract.
                </p>
                <p className="text-xs font-mono text-[#71717a]">Tx: 0xab12...f9c0</p>
                <button
                  onClick={() => setFundingState("idle")}
                  className="btn-outline text-xs py-2 px-4 mt-2"
                >
                  Fund More
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Connected Apps */}
          <div>
            <h2 className="text-lg font-display font-black uppercase text-white mb-4">Connected Apps</h2>
            <div className="border-struct bg-[#09090b] p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-[#27272a]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white">GitHub</span>
                  <p className="text-[10px] text-[#71717a] mt-0.5">PR merge → milestone complete</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 border border-green-500/20">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[#27272a]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Slack</span>
                  <p className="text-[10px] text-[#71717a] mt-0.5">Milestone notifications</p>
                </div>
                <a href="/dashboard/integrations" className="text-[10px] font-bold uppercase tracking-widest text-orange-600 hover:underline">Connect</a>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Gmail</span>
                  <p className="text-[10px] text-[#71717a] mt-0.5">Email alerts</p>
                </div>
                <a href="/dashboard/integrations" className="text-[10px] font-bold uppercase tracking-widest text-orange-600 hover:underline">Connect</a>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <h2 className="text-lg font-display font-black uppercase text-white mb-4">Participants</h2>
            <div className="border-struct bg-[#09090b] p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Client</p>
                <p className="text-sm font-mono text-white">GDEMO...ABC1</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Freelancer</p>
                <p className="text-sm font-mono text-white">GDEMO...XYZ9</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Network</p>
                <p className="text-sm font-mono text-white">Stellar Testnet</p>
              </div>
            </div>
          </div>

          {/* Dispute */}
          <div className="border border-red-500/20 bg-[#09090b] p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">Dispute Resolution</p>
            <p className="text-xs text-[#52525b]">If there's a disagreement, either party can raise a dispute. An arbitrator will review the on-chain evidence.</p>
            <button className="text-xs uppercase tracking-widest text-red-400 hover:underline">Raise Dispute →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
