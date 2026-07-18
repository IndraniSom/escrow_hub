import Link from "next/link";
import { FolderPlus, Clock, SearchCode, ShieldCheck, ChevronRight } from "lucide-react";

export default function ProjectsPage() {
  const projects = [
    { id: 1, title: "DeFi Dashboard Frontend", status: "Active", escrow: "$3,000", client: "0xABC...123", date: "2026-07-14", icon: ShieldCheck },
    { id: 2, title: "NFT Marketplace Contracts", status: "Pending", escrow: "$10,000", client: "0xDEF...456", date: "2026-07-12", icon: Clock },
  ];

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-struct-b pb-8 gap-6">
        <div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white flex items-center gap-4">
            <SearchCode className="w-8 h-8 text-orange-600" />
            My Projects
          </h1>
          <p className="text-[#a1a1aa] mt-2 font-mono text-sm uppercase tracking-widest">Active & Pending Escrows</p>
        </div>
        <Link href="/dashboard/projects/create" className="btn-primary flex items-center gap-2 hover:scale-[1.02] transition-transform duration-200 ease-in-out">
          <FolderPlus className="w-4 h-4" />
          Post a New Project
        </Link>
      </header>

      <div className="border-struct bg-[#09090b]">
        <div className="grid grid-cols-12 gap-4 p-4 border-struct-b text-xs uppercase tracking-widest text-[#a1a1aa] font-bold bg-[#111113]">
          <div className="col-span-5">Project Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Client Wallet</div>
          <div className="col-span-2 text-right">Escrow Amount</div>
        </div>
        
        {projects.map((p, idx) => {
          const StatusIcon = p.icon;
          return (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`} className={`block grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#1a1a1c] transition-all duration-200 ease-in-out group ${idx !== projects.length - 1 ? 'border-struct-b' : ''}`}>
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-10 h-10 border border-[#27272a] bg-[#111113] flex items-center justify-center text-[#a1a1aa] group-hover:border-orange-600 group-hover:text-orange-600 transition-colors duration-200 ease-in-out">
                  <StatusIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white group-hover:text-orange-500 transition-colors duration-200 ease-in-out flex items-center gap-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#a1a1aa] group-hover:text-[#d4d4d8] transition-colors mt-1 font-mono">
                    ID: PROJ-{p.id.toString().padStart(4, '0')} // {p.date}
                  </p>
                </div>
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-1.5 text-[10px] uppercase tracking-widest font-bold inline-flex items-center gap-1.5 border transition-all duration-200 ${p.status === 'Active' ? 'bg-orange-600/10 text-orange-600 border-orange-600/30' : 'bg-[#27272a]/50 text-[#a1a1aa] border-[#27272a]'}`}>
                  {p.status}
                </span>
              </div>
              <div className="col-span-3">
                <span className="font-mono text-xs text-[#d4d4d8] group-hover:text-white transition-colors duration-200">{p.client}</span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-3 font-bold font-mono text-white">
                {p.escrow}
                <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-orange-600 group-hover:translate-x-1 transition-all duration-200 ease-in-out" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
