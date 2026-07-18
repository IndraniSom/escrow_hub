import { CheckCircle2, Hexagon, GitMerge, DollarSign, AlertTriangle, Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "milestone",
      icon: CheckCircle2,
      iconColor: "text-green-500 bg-green-500/10 border-green-500/30",
      title: "Milestone Approved",
      body: "Your milestone 'Frontend Setup' on DeFi Dashboard has been approved.",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "escrow",
      icon: Hexagon,
      iconColor: "text-blue-400 bg-blue-400/10 border-blue-400/30",
      title: "Escrow Funded",
      body: "Client GDEMO...ABC1 funded $3,000 USDC to NFT Marketplace project escrow.",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "github",
      icon: GitMerge,
      iconColor: "text-white bg-[#27272a] border-[#52525b]",
      title: "GitHub: PR Merged",
      body: "Pull request #42 'Add analytics module' was merged. Milestone auto-verification triggered.",
      time: "3 hours ago",
      read: true,
    },
    {
      id: 4,
      type: "payment",
      icon: DollarSign,
      iconColor: "text-orange-500 bg-orange-500/10 border-orange-500/30",
      title: "Payment Released",
      body: "$500 USDC released for 'Initial Setup' milestone. Transaction: 0x3f1a...c4",
      time: "Yesterday",
      read: true,
    },
    {
      id: 5,
      type: "dispute",
      icon: AlertTriangle,
      iconColor: "text-red-400 bg-red-400/10 border-red-400/30",
      title: "Dispute Opened",
      body: "A dispute has been opened on project NFT Marketplace Contracts. Review required.",
      time: "2 days ago",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between border-struct-b pb-8 gap-4">
        <div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white flex items-center gap-4">
            <Bell className="w-8 h-8 text-orange-600" />
            Notifications
          </h1>
          <p className="text-[#a1a1aa] mt-2 text-sm uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
            {unreadCount} unread messages
          </p>
        </div>
        <button className="btn-outline text-xs py-2.5 px-5 flex items-center gap-2 hover:bg-white hover:text-black transition-all duration-200 ease-in-out">
          <CheckCheck className="w-4 h-4" />
          Mark All Read
        </button>
      </header>

      <div className="border-struct bg-[#09090b]">
        {notifications.map((n, i, arr) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`p-6 flex items-start gap-5 hover:bg-[#111113] transition-all duration-300 ease-in-out group cursor-pointer ${i !== arr.length - 1 ? "border-struct-b" : ""} ${!n.read ? "border-l-[3px] border-l-orange-600 bg-[#0f0f12]" : "border-l-[3px] border-l-transparent"}`}
            >
              <div className={`w-12 h-12 border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${n.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <p className={`text-sm font-bold uppercase tracking-wider group-hover:text-orange-500 transition-colors duration-200 ${!n.read ? "text-white" : "text-[#a1a1aa]"}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-[#52525b] whitespace-nowrap font-mono shrink-0 uppercase tracking-widest">{n.time}</span>
                </div>
                <p className={`text-sm leading-relaxed ${!n.read ? "text-[#d4d4d8]" : "text-[#71717a]"}`}>{n.body}</p>
              </div>
              {!n.read && (
                <span className="w-2.5 h-2.5 bg-orange-600 rounded-full shrink-0 mt-2 shadow-[0_0_8px_rgba(234,88,12,0.6)]"></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
