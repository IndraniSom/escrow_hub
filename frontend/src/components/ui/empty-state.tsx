"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="mb-6">
        <Icon className="w-12 h-12 text-[#a1a1aa]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[#fafafa] text-lg font-bold mb-2 uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-[#a1a1aa] text-sm max-w-md font-mono">
        {description}
      </p>
      {action && (
        <div className="mt-8">
          {action.href ? (
            <Link href={action.href} className="btn-primary inline-block">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
