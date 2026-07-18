"use client";

import { useState } from "react";
import { Mail, Webhook, Plug, Unplug, Settings, Loader2 } from "lucide-react";
import { SiNotion } from "react-icons/si";
import { FaSlack } from "react-icons/fa";

type IntegrationStatus = "connected" | "disconnected" | "connecting" | "error";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: IntegrationStatus;
  detail: string | null;
  scopes: string[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Receive real-time notifications when milestones are approved, payments are released, or disputes are raised.",
    icon: FaSlack,
    status: "disconnected",
    detail: null,
    scopes: ["channels:read", "chat:write"],
  },
  {
    id: "email",
    name: "Email (SMTP/API)",
    description: "Get email notifications for contract events and milestone status updates directly in your inbox.",
    icon: Mail,
    status: "disconnected",
    detail: null,
    scopes: ["email.send", "email.read"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Automatically sync project milestones, escrow statuses, and timeline events to your Notion databases.",
    icon: SiNotion,
    status: "disconnected",
    detail: null,
    scopes: ["databases:read", "pages:write"],
  },
];

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const map = {
    connected: "text-green-500 bg-green-500/10 border-green-500/30",
    disconnected: "text-[#a1a1aa] bg-[#27272a]/50 border-[#27272a]",
    connecting: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    error: "text-red-400 bg-red-500/10 border-red-500/30",
  };
  const label = {
    connected: "Connected",
    disconnected: "Not Connected",
    connecting: "Connecting...",
    error: "Error",
  };
  return (
    <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold border ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  function handleConnect(id: string) {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "connecting" } : i))
    );
    // Simulate OAuth redirect + callback delay
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: "connected",
                detail:
                  id === "slack"
                    ? "Connected to #escrow-hub"
                    : id === "email"
                    ? "Connected as user@example.com"
                    : id === "notion"
                    ? "Connected to 'Projects' Workspace"
                    : i.detail,
              }
            : i
        )
      );
    }, 1800);
  }

  function handleDisconnect(id: string) {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "disconnected", detail: null } : i
      )
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-12">
      <header className="border-struct-b pb-8">
        <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white flex items-center gap-3">
          <Plug className="w-8 h-8 text-orange-600" />
          Integrations
        </h1>
        <p className="text-[#a1a1aa] mt-2 text-sm uppercase tracking-widest">
          Connect third-party apps to automate your workflow
        </p>
      </header>

      {/* About Integrations */}
      <div className="border border-orange-600/30 bg-orange-600/5 p-6 space-y-2 transition-all hover:bg-orange-600/10 duration-300 ease-in-out">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Automation Engine
        </p>
        <p className="text-sm text-[#a1a1aa]">
          Our automation engine binds your external apps to smart contract events — for example, automatically updating a Notion page when a milestone is approved, or pinging Slack when funds are released.
        </p>
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div key={integration.id} className="border-struct bg-[#09090b] p-6 hover:bg-[#111113] transition-colors duration-300 ease-in-out group">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Icon + Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 border border-[#27272a] bg-[#111113] flex items-center justify-center text-white shrink-0 group-hover:border-orange-600/50 transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold uppercase tracking-wider text-white text-lg">{integration.name}</h3>
                      <StatusBadge status={integration.status} />
                    </div>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">{integration.description}</p>
                    {integration.status === "connected" && integration.detail && (
                      <p className="text-xs font-mono text-green-500 mt-2 p-2 bg-green-500/5 border border-green-500/20 inline-block">
                        {integration.detail}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {integration.scopes.map((scope) => (
                        <span key={scope} className="text-[10px] font-mono bg-[#1a1a1a] border border-[#27272a] px-2 py-0.5 text-[#71717a]">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="shrink-0 mt-4 md:mt-0">
                  {integration.status === "connected" && (
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="btn-outline text-xs py-2.5 px-5 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 ease-in-out flex items-center gap-2"
                    >
                      <Unplug className="w-3 h-3" />
                      Disconnect
                    </button>
                  )}
                  {integration.status === "disconnected" && (
                    <button
                      onClick={() => handleConnect(integration.id)}
                      className="btn-outline text-xs py-2.5 px-5 hover:bg-white hover:text-black transition-all duration-200 ease-in-out flex items-center gap-2"
                    >
                      <Plug className="w-3 h-3" />
                      Connect via OAuth
                    </button>
                  )}
                  {integration.status === "connecting" && (
                    <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 border border-yellow-500/30">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs uppercase tracking-widest font-bold">Connecting</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Automation Rules - only show when connected */}
              {integration.status === "connected" && integration.id === "notion" && (
                <div className="mt-6 pt-6 border-t border-[#27272a] space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">Active Automation Rules</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm p-3 bg-[#111113] border border-[#27272a] hover:border-[#52525b] transition-colors">
                      <span className="text-green-500 text-[10px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 font-bold uppercase">Active</span>
                      <span className="text-[#a1a1aa]">When milestone is approved →</span>
                      <span className="text-white font-bold">Update Notion Database Status</span>
                    </div>
                  </div>
                  <button className="text-xs uppercase tracking-widest text-orange-600 hover:text-orange-500 transition-colors mt-2 flex items-center gap-1">
                    <span className="text-lg leading-none">+</span> Add Automation Rule
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Webhook section */}
      <div className="border-struct bg-[#09090b] p-6 space-y-4 hover:border-orange-600/30 transition-all duration-300 ease-in-out group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-white flex items-center gap-2 text-lg">
              <Webhook className="w-5 h-5 text-orange-600" />
              Custom Webhooks
            </h3>
            <p className="text-sm text-[#a1a1aa] mt-1">Send HTTP POST events to your own endpoints on any contract action.</p>
          </div>
          <button className="btn-outline text-xs py-2.5 px-5 hover:bg-white hover:text-black transition-all duration-200 ease-in-out whitespace-nowrap">
            + Add Webhook
          </button>
        </div>
        <div className="border border-[#27272a] bg-[#111113] p-5 font-mono text-xs text-[#52525b] group-hover:border-[#52525b] transition-colors duration-300">
          <span className="text-[#a1a1aa]">No webhooks configured.</span> Add a URL to start receiving real-time escrow events.
        </div>
      </div>
    </div>
  );
}
