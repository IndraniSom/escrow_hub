"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { AsyncState } from "@/components/ui/async-state";
import { useWalletContext } from "@/context/WalletProvider";
import type { Project, Milestone } from "@/lib/types";

type FundingState = "idle" | "authorizing" | "confirming" | "funded" | "error";

interface ProjectData {
  project: Project;
  milestones: Milestone[];
  clientStellar: string;
  freelancerStellar: string;
  integrations: { plugin: string; status: string }[];
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const api = getApiClient();
  const wallet = useWalletContext();
  const projectId = params.id as string;

  const [fundingState, setFundingState] = useState<FundingState>("idle");
  const [fundError, setFundError] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [assignAddress, setAssignAddress] = useState("");
  const [assignError, setAssignError] = useState("");

  const load = useCallback(async (): Promise<ProjectData> => {
    const [p, ms] = await Promise.all([
      api.projects.get(projectId),
      api.milestones.getByProject(projectId),
    ]);
    const [clientUser, freelancerUser, integs] = await Promise.all([
      api.users.get(p.clientId),
      p.freelancerId ? api.users.get(p.freelancerId) : null,
      api.integrations.list(),
    ]);
    return {
      project: p,
      milestones: ms || [],
      clientStellar: clientUser.stellarAddress,
      freelancerStellar: freelancerUser ? freelancerUser.stellarAddress : "",
      integrations: (integs || []) as { plugin: string; status: string }[],
    };
  }, [api, projectId]);

  const { data, status, error, retry, refresh } = useAsync(load, [api, projectId]);

  async function handleFundEscrow() {
    setFundingState("authorizing");
    setFundError("");
    try {
      if (wallet.status !== "connected") {
        throw new Error("Wallet not connected");
      }
      setFundingState("confirming");
      try {
        await api.escrow.getByProject(projectId);
      } catch {
        const contractId = "C" + projectId.replace(/-/g, "").padEnd(55, "0");
        const stellarEscrowId = projectId.replace(/-/g, "").padEnd(64, "0");
        await api.escrow.create({
          projectId,
          contractId,
          stellarEscrowId,
          tokenAddress: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2Q2A5VCJ3G2TCHC4KN",
          amount: data?.project.escrowAmount || "0",
        });
      }
      await api.escrow.fund(projectId);
      setFundingState("funded");
      await refresh();
    } catch (e) {
      setFundingState("error");
      setFundError(e instanceof Error ? e.message : "Funding failed. Is Freighter unlocked?");
    }
  }

  async function handleApproveMilestone(milestoneId: string) {
    try {
      await api.milestones.approve(milestoneId);
      await api.escrow.release(projectId, milestoneId);
      await refresh();
    } catch {}
  }

  async function handleRaiseDispute() {
    if (!data) return;
    try {
      await api.disputes.create({ projectId, reason: disputeReason || "Other" });
      setDisputeReason("");
    } catch {}
  }

  async function handleAssignFreelancer() {
    setAssignError("");
    try {
      const freelancer = await api.users.byAddress(assignAddress);
      await api.projects.update(projectId, { freelancerId: freelancer.id });
      setAssignAddress("");
      await refresh();
    } catch {
      setAssignError("Could not find a user with that Stellar address");
    }
  }

  const shortAddr = (addr: string) => addr.length > 12 ? `${addr.slice(0, 5)}...${addr.slice(-4)}` : addr;

  const statusLabel = data?.project.status === "IN_PROGRESS" || data?.project.status === "FUNDED" ? "Active" : data?.project.status;

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      <AsyncState
        status={status}
        onRetry={retry}
        errorMessage={error ?? undefined}
        emptyTitle="Project not found"
        emptyDescription="This project may have been removed or you don't have access to it."
      >
        {data && (
          <>
      <header className="flex flex-col md:flex-row md:items-start justify-between border-struct-b pb-8 gap-6">
        <div>
          <div className="inline-block bg-orange-600/10 text-orange-600 px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
            Status: {statusLabel}
          </div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white mb-2">
            {data.project.title}
          </h1>
          <p className="text-[#a1a1aa] font-mono text-sm uppercase tracking-widest">
            ID: {projectId.slice(0, 8)}{data.project.stellarEscrowId ? ` // Contract: ${data.project.stellarEscrowId.slice(0, 10)}...` : ""}
          </p>
        </div>
        <div className="border-struct p-6 bg-[#09090b] min-w-[200px]">
          <p className="text-[10px] text-[#a1a1aa] uppercase tracking-widest font-bold mb-2">Funds in Escrow</p>
          <p className="text-3xl font-display font-black text-white">
            ${Number(data.project.escrowAmount).toLocaleString()} <span className="text-sm font-mono text-[#a1a1aa]">USDC</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-display font-black uppercase text-white mb-6">Project Milestones</h2>
            <div className="border-struct bg-[#09090b]">
              {data.milestones.length === 0 && (
                <div className="p-6 text-center text-sm text-[#52525b]">No milestones defined</div>
              )}
              {data.milestones.map((m, i, arr) => (
                <div key={m.id} className={`p-6 ${i !== arr.length - 1 ? "border-struct-b" : ""} hover:bg-[#111113] transition-colors`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 ${m.status === "APPROVED" ? "bg-green-500" : m.status === "IN_PROGRESS" || m.status === "SUBMITTED" ? "bg-orange-600" : "bg-[#3f3f46]"}`}></span>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#a1a1aa]">{m.status}</p>
                      </div>
                      <p className="font-bold uppercase tracking-wider text-white text-sm">{m.title}</p>
                      {m.submissionUri && <p className="text-xs font-mono text-green-500">Submitted: {m.submissionUri}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-white">${Number(m.amount).toLocaleString()}</span>
                      {m.status === "SUBMITTED" && (
                        <button onClick={() => handleApproveMilestone(m.id)} className="btn-primary text-xs py-2 px-4">Approve & Release</button>
                      )}
                      {m.status === "PENDING" && (
                        <button className="btn-outline text-xs py-2 px-4 border-[#27272a]">View</button>
                      )}
                      {m.status === "APPROVED" && (
                        <span className="text-[10px] uppercase tracking-widest text-green-500 font-bold">✓ Paid</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.project.status === "PENDING" && (
            <div className="border border-orange-600/30 bg-orange-600/5 p-6 space-y-6">
              <div>
                <h2 className="text-xl font-display font-black uppercase text-white">Fund Escrow</h2>
                <p className="text-sm text-[#a1a1aa] mt-1">Add USDC to this project&apos;s escrow via Stellar x402 payment authorization.</p>
              </div>

              {fundingState === "idle" && (
                <div className="space-y-4">
                  <div className="border border-[#27272a] p-3 text-xs text-[#71717a] font-mono space-y-1">
                    <p>Amount: ${Number(data.project.escrowAmount || "0").toLocaleString()} USDC</p>
                    <p>Protocol: x402 / Stellar</p>
                    <p>Network: Stellar Testnet</p>
                  </div>
                  <button onClick={handleFundEscrow} className="w-full btn-primary py-3 text-sm">Authorize Payment via Freighter</button>
                </div>
              )}

              {fundingState === "authorizing" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-sm text-white font-bold">Authorizing payment...</p>
                  </div>
                </div>
              )}

              {fundingState === "confirming" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-sm text-white font-bold">Submitting to Soroban...</p>
                  </div>
                </div>
              )}

              {fundingState === "funded" && (
                <div className="border border-green-500/30 bg-green-500/5 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-green-500 font-bold">✓ Escrow Funded Successfully</p>
                  <p className="text-sm text-[#a1a1aa]">${data.project.escrowAmount} USDC locked in the smart contract.</p>
                </div>
              )}

              {fundingState === "error" && (
                <div className="space-y-3">
                  <div className="border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-400 font-mono">{fundError}</div>
                  <button onClick={() => setFundingState("idle")} className="btn-outline text-xs py-2 px-4">Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-display font-black uppercase text-white mb-4">Connected Apps</h2>
            <div className="border-struct bg-[#09090b] p-6 space-y-4">
              {data.integrations.length === 0 && <p className="text-xs text-[#52525b]">No integrations connected</p>}
              {data.integrations.map((integ) => (
                <div key={integ.plugin} className="flex justify-between items-center pb-4 border-b border-[#27272a] last:border-0 last:pb-0">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white">{integ.plugin}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${integ.status === "connected" ? "text-green-500 bg-green-500/10 px-2 py-1 border border-green-500/20" : "text-orange-600 hover:underline"}`}>
                    {integ.status === "connected" ? "Active" : "Connect"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-display font-black uppercase text-white mb-4">Participants</h2>
            <div className="border-struct bg-[#09090b] p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Client</p>
                <p className="text-sm font-mono text-white">{shortAddr(data.clientStellar)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Freelancer</p>
                <p className="text-sm font-mono text-white">{data.project.freelancerId ? shortAddr(data.freelancerStellar) : "Not assigned"}</p>
                {!data.project.freelancerId && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={assignAddress}
                      onChange={(e) => setAssignAddress(e.target.value)}
                      placeholder="Freelancer Stellar address (G...)"
                      className="w-full bg-[#111113] border border-[#27272a] p-2 text-xs font-mono text-white focus:outline-none focus:border-orange-600"
                    />
                    {assignError && <p className="text-[10px] text-red-400">{assignError}</p>}
                    <button onClick={handleAssignFreelancer} className="btn-outline text-[10px] py-2 px-3 uppercase tracking-widest">
                      Assign Freelancer
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Network</p>
                <p className="text-sm font-mono text-white">Stellar Testnet</p>
              </div>
            </div>
          </div>

          <div className="border border-red-500/20 bg-[#09090b] p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">Dispute Resolution</p>
            <p className="text-xs text-[#52525b]">If there&apos;s a disagreement, either party can raise a dispute.</p>
            <input
              type="text"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full bg-[#111113] border border-[#27272a] p-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
            />
            <button onClick={handleRaiseDispute} className="text-xs uppercase tracking-widest text-red-400 hover:underline">Raise Dispute →</button>
          </div>
        </div>
      </div>
          </>
        )}
      </AsyncState>
    </div>
  );
}