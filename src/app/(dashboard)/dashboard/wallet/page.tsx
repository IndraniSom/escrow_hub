import { Wallet, Copy, ArrowUpRight, ArrowDownLeft, Activity, Globe, ShieldCheck } from "lucide-react";

export default function WalletPage() {
  const address = "GDEMO3DHFB2Y6M4LNK...XLM123";
  const shortAddress = "GDEMO...XLM123";

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span className="text-xs text-green-500 font-medium">Freighter Connected</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <Globe className="w-3 h-3 text-[#a1a1aa]" />
              <span className="text-xs text-[#a1a1aa] font-medium">Stellar PubNet</span>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-white flex items-center gap-3 tracking-tight">
            <Wallet className="w-8 h-8 text-white/50" />
            Wallet Overview
          </h1>
        </div>
      </header>

      {/* Primary Balance Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 md:p-12 backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-12 justify-between">
          <div className="space-y-6 flex-1">
            <p className="text-sm font-medium text-[#a1a1aa]">Total Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl text-white/50 font-light">$</span>
              <span className="text-6xl md:text-8xl font-bold text-white tracking-tighter">8,420<span className="text-4xl text-white/30">.00</span></span>
            </div>
          </div>
          
          <div className="space-y-4 md:min-w-[320px]">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-medium text-[#a1a1aa] flex items-center gap-2">
                Wallet Address
              </p>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-mono text-white truncate">{shortAddress}</p>
                <button className="text-[#a1a1aa] hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex justify-between items-center">
               <p className="text-xs font-medium text-[#a1a1aa]">Available XLM</p>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold text-white">512.40</span>
                  <span className="text-xs text-[#71717a]">XLM</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl border border-white/5 bg-[#09090b] hover:bg-[#111113] transition-colors">
           <span className="text-sm text-[#a1a1aa] mb-3 block">Currently Locked</span>
           <span className="text-3xl font-semibold text-white">$3,000</span>
        </div>
        <div className="p-8 rounded-3xl border border-white/5 bg-[#09090b] hover:bg-[#111113] transition-colors">
           <span className="text-sm text-[#a1a1aa] mb-3 block">Total Released</span>
           <span className="text-3xl font-semibold text-[#22c55e]">$1,500</span>
        </div>
        <div className="p-8 rounded-3xl border border-white/5 bg-[#09090b] hover:bg-[#111113] transition-colors">
           <span className="text-sm text-[#a1a1aa] mb-3 block">Active Contracts</span>
           <span className="text-3xl font-semibold text-white">3</span>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-white/50" />
          Recent Activity
        </h2>
        
        <div className="rounded-3xl border border-white/5 bg-[#09090b] overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 text-xs font-medium text-[#71717a] bg-[#111113]">
            <div className="col-span-4 md:col-span-3 lg:col-span-2">Type</div>
            <div className="col-span-4 md:col-span-4">Description</div>
            <div className="hidden lg:block col-span-3">Hash</div>
            <div className="col-span-4 md:col-span-5 lg:col-span-3 text-right">Amount</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {[
              { type: "Release", desc: "Milestone: Frontend Setup", hash: "0x3f1a...c4", amount: "+500", positive: true },
              { type: "Fund", desc: "Escrow: DeFi Dashboard", hash: "0x8b2c...a1", amount: "-3,000", positive: false },
              { type: "Release", desc: "Milestone: API Integration", hash: "0xac9d...f7", amount: "+1,000", positive: true },
              { type: "Fund", desc: "Escrow: NFT Marketplace", hash: "0x1d4e...22", amount: "-10,000", positive: false },
            ].map((tx, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="col-span-4 md:col-span-3 lg:col-span-2 flex items-center gap-4">
                  <div className={`p-2 rounded-full ${tx.positive ? "bg-green-500/10 text-green-500" : "bg-white/10 text-white"}`}>
                    {tx.positive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-white">{tx.type}</span>
                </div>
                <div className="col-span-4 md:col-span-4">
                  <p className="text-sm text-white/80">{tx.desc}</p>
                </div>
                <div className="hidden lg:block col-span-3">
                  <p className="text-sm font-mono text-[#71717a]">
                    {tx.hash}
                  </p>
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
