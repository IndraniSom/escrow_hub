"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenTool, Target, Wallet, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Info } from "lucide-react";

type Step = 1 | 2 | 3;

interface Milestone {
  id: number;
  name: string;
  amount: string;
  description: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalBudget, setTotalBudget] = useState("");

  // Step 2
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, name: "", amount: "", description: "" },
  ]);

  // Step 3 - funding
  const [fundingState, setFundingState] = useState<"idle" | "authorizing" | "success">("idle");

  function addMilestone() {
    setMilestones((prev) => [
      ...prev,
      { id: Date.now(), name: "", amount: "", description: "" },
    ]);
  }

  function removeMilestone(id: number) {
    if (milestones.length === 1) return;
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMilestone(id: number, field: keyof Milestone, value: string) {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setFundingState("authorizing");
    await new Promise((r) => setTimeout(r, 2000));
    setFundingState("success");
    setIsSubmitting(false);
    setTimeout(() => router.push("/dashboard/projects/1"), 1500);
  }

  const steps = [
    { num: 1, label: "Project Details", icon: PenTool },
    { num: 2, label: "Define Milestones", icon: Target },
    { num: 3, label: "Fund Escrow", icon: Wallet },
  ];

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-10">
      <header className="border-struct-b pb-8">
        <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white flex items-center gap-3">
          <Plus className="w-8 h-8 text-orange-600" />
          Post a Project
        </h1>
        <p className="text-[#a1a1aa] mt-2 font-mono text-sm uppercase tracking-widest">
          Create a new escrow-backed project on Stellar
        </p>
      </header>

      {/* Progress Steps */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          return (
            <div key={s.num} className="flex items-center flex-1">
              <button
                onClick={() => step > s.num && setStep(s.num as Step)}
                className={`flex items-center gap-3 ${step > s.num ? "cursor-pointer group" : "cursor-default"}`}
              >
                <div
                  className={`w-10 h-10 border flex items-center justify-center transition-all duration-300 ease-in-out ${
                    step >= s.num
                      ? "border-orange-600 text-orange-600 bg-orange-600/10 shadow-[0_0_15px_rgba(234,88,12,0.2)]"
                      : "border-[#27272a] text-[#52525b] bg-[#111113]"
                  } ${step > s.num ? "group-hover:bg-orange-600 group-hover:text-white" : ""}`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <div className={`text-left hidden sm:block ${step >= s.num ? "text-white" : "text-[#52525b]"}`}>
                  <p className="text-[10px] font-mono text-orange-600">STEP {s.num}</p>
                  <span className="text-xs uppercase tracking-widest font-bold">
                    {s.label}
                  </span>
                </div>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 transition-colors duration-500 ${step > s.num ? "bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.5)]" : "bg-[#27272a]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Project Details */}
      {step === 1 && (
        <div className="border-struct bg-[#09090b] p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <div className="space-y-2 group">
            <label className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest transition-colors">
              Project Name <span className="text-white">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build a DeFi staking dashboard"
              className="w-full bg-[#111113] border-struct p-4 text-white font-mono text-sm focus:outline-none focus:border-orange-600 focus:shadow-[0_0_0_1px_rgba(234,88,12,1)] transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-orange-600 uppercase tracking-widest">Description <span className="text-white">*</span></label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need built, the tech stack, and any specific requirements..."
              className="w-full bg-[#111113] border-struct p-4 text-white font-mono text-sm focus:outline-none focus:border-orange-600 focus:shadow-[0_0_0_1px_rgba(234,88,12,1)] transition-all duration-200 resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-orange-600 uppercase tracking-widest">Total Budget (USDC) <span className="text-white">*</span></label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] font-mono group-focus-within:text-orange-600 transition-colors">$</span>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="5000"
                className="w-full bg-[#111113] border-struct p-4 pl-8 text-white font-mono text-sm focus:outline-none focus:border-orange-600 focus:shadow-[0_0_0_1px_rgba(234,88,12,1)] transition-all duration-200"
              />
            </div>
            <p className="flex items-center gap-1.5 text-[10px] text-[#a1a1aa] uppercase tracking-widest mt-2">
              <Info className="w-3 h-3 text-orange-600" />
              This will be locked in a Soroban escrow contract on Stellar.
            </p>
          </div>
          <div className="pt-4 border-t border-[#27272a]">
            <button
              disabled={!title || !description || !totalBudget}
              onClick={() => setStep(2)}
              className="w-full btn-primary py-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors duration-200 ease-in-out"
            >
              Next: Define Milestones <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Milestones */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <div className="border border-[#27272a] bg-[#111113] p-4 text-xs font-mono flex items-center justify-between">
            <div className="flex flex-col gap-1 text-[#a1a1aa]">
              <p>Project: <span className="text-white font-bold">{title}</span></p>
            </div>
            <div className="flex flex-col gap-1 text-[#a1a1aa] text-right">
              <p>Total Budget: <span className="text-green-500 font-bold">${totalBudget} USDC</span></p>
            </div>
          </div>

          <div className="space-y-4">
            {milestones.map((m, idx) => (
              <div key={m.id} className="border-struct bg-[#09090b] p-6 space-y-4 transition-all duration-300 hover:border-orange-600/30">
                <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Milestone {idx + 1}
                  </h3>
                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(m.id)}
                      className="text-[10px] text-red-400 hover:text-white hover:bg-red-500 px-2 py-1 border border-red-500/30 hover:border-red-500 transition-all duration-200 uppercase tracking-widest flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Name</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMilestone(m.id, "name", e.target.value)}
                      placeholder="e.g. Frontend Setup"
                      className="w-full bg-[#111113] border border-[#27272a] p-3 text-white font-mono text-sm focus:outline-none focus:border-orange-600 focus:shadow-[0_0_0_1px_rgba(234,88,12,0.5)] transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Payout (USDC)</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] font-mono text-xs group-focus-within:text-orange-600 transition-colors">$</span>
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => updateMilestone(m.id, "amount", e.target.value)}
                        placeholder="1000"
                        className="w-full bg-[#111113] border border-[#27272a] p-3 pl-6 text-white font-mono text-sm focus:outline-none focus:border-orange-600 focus:shadow-[0_0_0_1px_rgba(234,88,12,0.5)] transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Completion Criteria</label>
                    <textarea
                      rows={2}
                      value={m.description}
                      onChange={(e) => updateMilestone(m.id, "description", e.target.value)}
                      placeholder="What defines done for this milestone?"
                      className="w-full bg-[#111113] border border-[#27272a] p-3 text-white font-mono text-sm focus:outline-none focus:border-orange-600 focus:shadow-[0_0_0_1px_rgba(234,88,12,0.5)] transition-all duration-200 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addMilestone} className="w-full btn-outline py-4 text-sm border-dashed border-[#27272a] hover:border-orange-600 hover:text-orange-600 hover:bg-orange-600/5 transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Another Milestone
          </button>

          <div className="flex gap-4 pt-4 border-t border-[#27272a]">
            <button onClick={() => setStep(1)} className="flex-1 btn-outline py-4 flex items-center justify-center gap-2 hover:bg-[#1a1a1c] transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors duration-200">
              Next: Fund Escrow <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Fund */}
      {step === 3 && (
        <div className="border-struct bg-[#09090b] p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-display font-black uppercase text-white">Review & Fund</h2>
            <p className="text-sm text-[#a1a1aa]">Review your project structure before locking funds in escrow.</p>
          </div>
          
          <div className="border border-[#27272a] bg-[#111113] p-6 font-mono text-sm space-y-4 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[#a1a1aa]">Project</span>
              <span className="text-white font-bold">{title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#a1a1aa]">Milestones</span>
              <span className="text-white">{milestones.length}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#27272a] pt-4">
              <span className="text-[#a1a1aa]">Escrow Amount</span>
              <span className="text-green-500 font-bold text-lg">${totalBudget} USDC</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[#27272a] border-dashed">
              <span className="text-[#52525b] text-xs">Protocol</span>
              <span className="text-[#71717a] text-xs">Stellar x402 + Soroban</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#52525b] text-xs">Network</span>
              <span className="text-[#71717a] text-xs">Stellar Testnet</span>
            </div>
          </div>

          {fundingState === "idle" && (
            <div className="space-y-6">
              <div className="bg-orange-600/10 border border-orange-600/30 p-4 text-xs text-orange-600 flex gap-3">
                <Info className="w-4 h-4 shrink-0" />
                <p>Clicking below will prompt your Freighter wallet to sign the escrow funding transaction. Funds will be securely locked on Soroban.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 btn-outline py-4 flex items-center justify-center gap-2 hover:bg-[#1a1a1c] transition-colors duration-200">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleFinalSubmit} className="flex-[2] btn-primary py-4 flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors duration-200 shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                  <Wallet className="w-4 h-4" /> Sign & Fund Escrow
                </button>
              </div>
            </div>
          )}

          {fundingState === "authorizing" && (
            <div className="text-center space-y-6 py-8">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto" />
              <div>
                <p className="text-base font-bold text-white uppercase tracking-widest mb-2">Authorizing Payment...</p>
                <p className="text-sm text-[#a1a1aa]">Please confirm the transaction in Freighter. Deploying Soroban contract.</p>
              </div>
            </div>
          )}

          {fundingState === "success" && (
            <div className="border border-green-500/30 bg-green-500/10 p-8 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <CheckCircle2 className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-display font-black uppercase text-green-500">Project Created!</h3>
              <p className="text-sm text-[#a1a1aa]">Escrow is live on Stellar. Redirecting you to your project dashboard...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
