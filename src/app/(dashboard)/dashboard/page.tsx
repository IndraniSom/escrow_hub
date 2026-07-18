export default function DashboardPage() {
  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      <header className="border-struct-b pb-8">
        <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white">Dashboard</h1>
        <p className="text-[#a1a1aa] mt-2 font-mono text-sm uppercase tracking-widest">Your Account Overview</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 border-struct">
        <div className="p-8 border-struct-b md:border-struct-b-0 md:border-struct-r bg-[#09090b]">
          <h3 className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">Total Funds in Escrow</h3>
          <p className="text-4xl font-display font-black text-white">$12,450 <span className="text-lg text-[#a1a1aa] font-mono tracking-widest">USDC</span></p>
        </div>
        <div className="p-8 border-struct-b md:border-struct-b-0 md:border-struct-r bg-[#09090b]">
          <h3 className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">Active Projects</h3>
          <p className="text-4xl font-display font-black text-white">03</p>
        </div>
        <div className="p-8 bg-[#09090b]">
          <h3 className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">Completed Milestones</h3>
          <p className="text-4xl font-display font-black text-white">14</p>
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
          
          <div className="grid grid-cols-12 gap-4 p-4 border-struct-b items-center hover:bg-[#111113] transition-colors">
            <div className="col-span-3">
              <span className="bg-green-500/10 text-green-500 px-2 py-1 text-xs uppercase tracking-widest font-bold">Paid Out</span>
            </div>
            <div className="col-span-6">
              <p className="text-white font-bold text-sm">DeFi Dashboard - Frontend Setup</p>
              <p className="text-xs text-[#a1a1aa]">Transaction: 0x8f...4a2b</p>
            </div>
            <div className="col-span-3 text-right text-green-500 font-bold">
              +$1,500 USDC
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#111113] transition-colors">
            <div className="col-span-3">
              <span className="bg-blue-500/10 text-blue-500 px-2 py-1 text-xs uppercase tracking-widest font-bold">Funded</span>
            </div>
            <div className="col-span-6">
              <p className="text-white font-bold text-sm">NFT Marketplace Smart Contracts</p>
              <p className="text-xs text-[#a1a1aa]">Transaction: 0x3c...9d1e</p>
            </div>
            <div className="col-span-3 text-right text-blue-500 font-bold">
              -$5,000 USDC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
