"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiClient } from "@/lib/api";
import type { Project, Milestone, Dispute, Integration } from "@/lib/types";

type FundingState = "idle" | "authorizing" | "confirming" | "funded" | "error";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const api = getApiClient();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [clientStellar, setClientStellar] = useState("...");
  const [freelancerStellar, setFreelancerStellar] = useState("...");
  const [integrations, setIntegrations] = useState<{ plugin: string; status: string }[]>([]);
  const [fundingState, setFundingState] = useState<FundingState>("idle");
  const [fundAmount, setFundAmount] = useState("");

  useEffect(() => {
    if (!projectId) return;
    async function load() {
      try {
        const [p, ms] = await Promise.all([
          api.projects.get(projectId),
          api.milestones.getByProject(projectId),
        ]);
        setProject(p);
        setMilestones(ms || []);
        setFundAmount(p.escrowAmount || "0");

        const [clientUser, freelancerUser, integs] = await Promise.all([
          api.users.get(p.clientId),
          p.freelancerId ? api.users.get(p.freelancerId) : null,
          api.integrations.list(),
        ]);
        setClientStellar(clientUser.stellarAddress);
        if (freelancerUser) setFreelancerStellar(freelancerUser.stellarAddress);
        setIntegrations((integs || []) as { plugin: string; status: string }[]);
      } catch {
        router.push("/dashboard/projects");
      }
    }
    load();
  }, [projectId, api, router]);

  async function handleFundEscrow() {
    setFundingState("authorizing");
    try {
      const freighterApi = (window as any).freighterApi;
      if (!freighterApi) throw new Error("Freighter not found");
      const publicKey = await freighterApi.getPublicKey();
      if (!publicKey) throw new Error("No public key");
      setFundingState("confirming");
      await api.escrow.fund(projectId);
      setFundingState("funded");
    } catch {
      setFundingState("error");
    }
  }

  async function handleApproveMilestone(milestoneId: string) {
    try {
      await api.milestones.approve(milestoneId);
      const ms = await api.milestones.getByProject(projectId);
      setMilestones(ms || []);
    } catch {}
  }

  async function handleRaiseDispute() {
    if (!project) return;
    try {
      await           api.disputes.create({ projectId, reason: "Other" });
    } catch {}
  }

  const shortAddr = (addr: string) => addr.length > 12 ? `${addr.slice(0, 5)}...${addr.slice(-4)}` : addr;

  if (!project) return <div className="p-12 text-center text-[#52525b]">Loading...</div>;

  const statusLabel = project.status === "IN_PROGRESS" || project.status === "FUNDED" ? "Active" : project.status;

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between border-struct-b pb-8 gap-6">
        <div>
          <div className="inline-block bg-orange-600/10 text-orange-600 px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
            Status: {statusLabel}
          </div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white mb-2">
            {project.title}
          </h1>
          <p className="text-[#a1a1aa] font-mono text-sm uppercase tracking-widest">
            ID: {projectId.slice(0, 8)}{project.stellarEscrowId ? ` // Contract: ${project.stellarEscrowId.slice(0, 10)}...` : ""}
          </p>
        </div>
        <div className="border-struct p-6 bg-[#09090b] min-w-[200px]">
          <p className="text-[10px] text-[#a1a1aa] uppercase tracking-widest font-bold mb-2">Funds in Escrow</p>
          <p className="text-3xl font-display font-black text-white">
            ${Number(project.escrowAmount).toLocaleString()} <span className="text-sm font-mono text-[#a1a1aa]">USDC</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Milestones */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-display font-black uppercase text-white mb-6">Project Milestones</h2>
            <div className="border-struct bg-[#09090b]">
              {milestones.length === 0 && (
                <div className="p-6 text-center text-sm text-[#52525b]">No milestones defined</div>
              )}
              {milestones.map((m, i, arr) => (
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

          {/* Escrow Funding Panel */}
          {project.status === "PENDING" && (
            <div className="border border-orange-600/30 bg-orange-600/5 p-6 space-y-6">
              <div>
                <h2 className="text-xl font-display font-black uppercase text-white">Fund Escrow</h2>
                <p className="text-sm text-[#a1a1aa] mt-1">Add USDC to this project's escrow via Stellar x402 payment authorization.</p>
              </div>

              {fundingState === "idle" && (
                <div className="space-y-4">
                  <div className="border border-[#27272a] p-3 text-xs text-[#71717a] font-mono space-y-1">
                    <p>Amount: ${Number(fundAmount).toLocaleString()} USDC</p>
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
                  <p className="text-sm text-[#a1a1aa]">${fundAmount} USDC locked in the smart contract.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Connected Apps */}
          <div>
            <h2 className="text-lg font-display font-black uppercase text-white mb-4">Connected Apps</h2>
            <div className="border-struct bg-[#09090b] p-6 space-y-4">
              {integrations.length === 0 && <p className="text-xs text-[#52525b]">No integrations connected</p>}
              {integrations.map((integ) => (
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

          {/* Participants */}
          <div>
            <h2 className="text-lg font-display font-black uppercase text-white mb-4">Participants</h2>
            <div className="border-struct bg-[#09090b] p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Client</p>
                <p className="text-sm font-mono text-white">{shortAddr(clientStellar)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold mb-1">Freelancer</p>
                <p className="text-sm font-mono text-white">{project.freelancerId ? shortAddr(freelancerStellar) : "Not assigned"}</p>
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
            <p className="text-xs text-[#52525b]">If there's a disagreement, either party can raise a dispute.</p>
            <button onClick={handleRaiseDispute} className="text-xs uppercase tracking-widest text-red-400 hover:underline">Raise Dispute →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
