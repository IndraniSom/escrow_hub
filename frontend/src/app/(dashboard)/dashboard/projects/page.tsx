"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FolderPlus, SearchCode, ChevronRight } from "lucide-react";
import { getApiClient } from "@/lib/api";
import type { User } from "@/lib/types";

export default function ProjectsPage() {
  const api = getApiClient();
  const [projects, setProjects] = useState<{ id: string; title: string; status: string; escrowAmount: string; clientStellar: string; createdAt: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.projects.list({ limit: 50 });
        const items = await Promise.all(
          res.data.map(async (p: { id: string; title: string; status: string; escrowAmount: string; clientId: string; createdAt: string }) => {
            let clientStellar = "Unknown";
            try {
              const user = await api.users.get(p.clientId);
              clientStellar = user.stellarAddress;
            } catch {}
            return {
              id: p.id,
              title: p.title,
              status: p.status,
              escrowAmount: p.escrowAmount,
              clientStellar: clientStellar.length > 12 ? `${clientStellar.slice(0, 5)}...${clientStellar.slice(-4)}` : clientStellar,
              createdAt: p.createdAt,
            };
          })
        );
        setProjects(items);
      } catch {}
    }
    load();
  }, [api]);

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
        
        {projects.length === 0 && (
          <div className="p-8 text-center text-sm text-[#52525b]">No projects yet</div>
        )}
        {projects.map((p, idx) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`} className={`block grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#1a1a1c] transition-all duration-200 ease-in-out group ${idx !== projects.length - 1 ? 'border-struct-b' : ''}`}>
            <div className="col-span-5 flex items-center gap-4">
              <div className="w-10 h-10 border border-[#27272a] bg-[#111113] flex items-center justify-center text-[#a1a1aa] group-hover:border-orange-600 group-hover:text-orange-600 transition-colors duration-200 ease-in-out">
                <SearchCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-white group-hover:text-orange-500 transition-colors duration-200 ease-in-out flex items-center gap-2">
                  {p.title}
                </h3>
                <p className="text-xs text-[#a1a1aa] group-hover:text-[#d4d4d8] transition-colors mt-1 font-mono">
                  ID: {p.id.slice(0, 8)} // {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="col-span-2">
              <span className={`px-2 py-1.5 text-[10px] uppercase tracking-widest font-bold inline-flex items-center gap-1.5 border transition-all duration-200 ${p.status === 'IN_PROGRESS' || p.status === 'ACTIVE' ? 'bg-orange-600/10 text-orange-600 border-orange-600/30' : 'bg-[#27272a]/50 text-[#a1a1aa] border-[#27272a]'}`}>
                {p.status === "IN_PROGRESS" || p.status === "FUNDED" ? "Active" : p.status}
              </span>
            </div>
            <div className="col-span-3">
              <span className="font-mono text-xs text-[#d4d4d8] group-hover:text-white transition-colors duration-200">{p.clientStellar}</span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-3 font-bold font-mono text-white">
              ${Number(p.escrowAmount).toLocaleString()}
              <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-orange-600 group-hover:translate-x-1 transition-all duration-200 ease-in-out" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
