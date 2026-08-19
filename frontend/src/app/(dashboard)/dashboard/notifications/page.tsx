"use client";

import { useCallback, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { getApiClient } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { AsyncState } from "@/components/ui/async-state";

function timeAgo(dateStr: string, now: number): string {
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function NotificationsPage() {
  const api = getApiClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const res = await api.notifications.list({ limit: 50 });
    const now = Date.now();
    setUnreadCount(res.meta.unreadCount || 0);
    return res.data.map((n) => ({ ...n, timeAgo: timeAgo(n.createdAt, now) }));
  }, [api]);

  const { data: notifications, status, error, retry } = useAsync(load, [api], (items) => items.length === 0);

  async function handleMarkAllRead() {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      retry();
    } catch {}
  }

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
        <button onClick={handleMarkAllRead} className="btn-outline text-xs py-2.5 px-5 flex items-center gap-2 hover:bg-white hover:text-black transition-all duration-200 ease-in-out">
          <CheckCheck className="w-4 h-4" />
          Mark All Read
        </button>
      </header>

      <AsyncState
        status={status}
        onRetry={retry}
        errorMessage={error ?? undefined}
        emptyTitle="No notifications yet"
        emptyDescription="When there is activity on your escrows, notifications will show up here."
      >
      <div className="border-struct bg-[#09090b]">
        {notifications!.map((n, i, arr) => (
          <div key={n.id} className={`p-6 flex items-start gap-5 hover:bg-[#111113] transition-all duration-300 ease-in-out group cursor-pointer ${i !== arr.length - 1 ? "border-struct-b" : ""} ${!n.read ? "border-l-[3px] border-l-orange-600 bg-[#0f0f12]" : "border-l-[3px] border-l-transparent"}`}>
            <div className="flex-1 min-w-0 space-y-2 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <p className={`text-sm font-bold uppercase tracking-wider group-hover:text-orange-500 transition-colors duration-200 ${!n.read ? "text-white" : "text-[#a1a1aa]"}`}>
                  {n.title}
                </p>
                <span className="text-[10px] text-[#52525b] whitespace-nowrap font-mono shrink-0 uppercase tracking-widest">{n.timeAgo}</span>
              </div>
              <p className={`text-sm leading-relaxed ${!n.read ? "text-[#d4d4d8]" : "text-[#71717a]"}`}>{n.body}</p>
            </div>
            {!n.read && <span className="w-2.5 h-2.5 bg-orange-600 rounded-full shrink-0 mt-2 shadow-[0_0_8px_rgba(234,88,12,0.6)]"></span>}
          </div>
        ))}
      </div>
      </AsyncState>
    </div>
  );
}
