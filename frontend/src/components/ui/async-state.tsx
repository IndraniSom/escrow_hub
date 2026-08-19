"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Loader2, Inbox, TriangleAlert, ShieldX, RotateCw } from "lucide-react";

export type AsyncStatus =
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "unauthorized"
  | "forbidden";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 border-struct bg-[#09090b] animate-pulse">
      <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      <p className="text-xs font-mono uppercase tracking-widest text-[#a1a1aa]">{label}</p>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 border-struct bg-[#09090b] text-center">
      <div className="w-14 h-14 border border-[#27272a] bg-[#111113] flex items-center justify-center">
        <Inbox className="w-6 h-6 text-[#52525b]" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold uppercase tracking-widest text-white">{title}</p>
        {description && <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong. Try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 border-struct bg-[#09090b] text-center">
      <div className="w-14 h-14 border border-red-500/30 bg-red-500/10 flex items-center justify-center">
        <TriangleAlert className="w-6 h-6 text-red-400" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold uppercase tracking-widest text-red-400">Something went wrong</p>
        <p className="text-xs font-mono text-[#a1a1aa] max-w-md mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-outline text-xs py-2 px-4 flex items-center gap-2 hover:bg-white hover:text-black transition-all duration-200"
        >
          <RotateCw className="w-3 h-3" /> Try Again
        </button>
      )}
    </div>
  );
}

export function UnauthorizedState({ forbidden = false }: { forbidden?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 border-struct bg-[#09090b] text-center">
      <div className="w-14 h-14 border border-orange-600/30 bg-orange-600/10 flex items-center justify-center">
        <ShieldX className="w-6 h-6 text-orange-600" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold uppercase tracking-widest text-white">
          {forbidden ? "Access Denied" : "Authentication Required"}
        </p>
        <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
          {forbidden
            ? "You don't have permission to view this resource."
            : "Your session has expired or you aren't signed in."}
        </p>
      </div>
      {forbidden ? (
        <Link href="/dashboard" className="btn-outline text-xs py-2 px-4 hover:bg-white hover:text-black transition-all duration-200">
          Back to Dashboard
        </Link>
      ) : (
        <Link href="/sign-in" className="btn-primary text-xs py-2 px-4">
          Sign In
        </Link>
      )}
    </div>
  );
}

export function AsyncState({
  status,
  onRetry,
  errorMessage,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: {
  status: AsyncStatus;
  onRetry?: () => void;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  children?: ReactNode;
}) {
  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={errorMessage} onRetry={onRetry} />;
  if (status === "unauthorized") return <UnauthorizedState />;
  if (status === "forbidden") return <UnauthorizedState forbidden />;
  if (status === "empty")
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  return <>{children}</>;
}