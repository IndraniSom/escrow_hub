"use client";

interface LoadingSkeletonProps {
  type: "card" | "list" | "text" | "stats";
  count?: number;
}

const skeletonItemStyle =
  "bg-[#27272a] animate-pulse";

function CardSkeleton() {
  return (
    <div className="border border-[#27272a] p-6 bg-[#09090b]">
      <div className={`${skeletonItemStyle} h-5 w-3/4 mb-4`} />
      <div className={`${skeletonItemStyle} h-3 w-full mb-3`} />
      <div className={`${skeletonItemStyle} h-3 w-5/6 mb-3`} />
      <div className={`${skeletonItemStyle} h-3 w-2/3 mb-5`} />
      <div className="flex gap-3">
        <div className={`${skeletonItemStyle} h-4 w-16`} />
        <div className={`${skeletonItemStyle} h-4 w-16`} />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="border border-[#27272a] bg-[#09090b]">
      <div className="flex items-center gap-4 p-4 border-b border-[#27272a]">
        <div className={`${skeletonItemStyle} h-4 w-8`} />
        <div className={`${skeletonItemStyle} h-4 w-40 flex-1`} />
        <div className={`${skeletonItemStyle} h-4 w-24`} />
        <div className={`${skeletonItemStyle} h-4 w-16`} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-[#27272a] last:border-0">
          <div className={`${skeletonItemStyle} h-3 w-4`} />
          <div className={`${skeletonItemStyle} h-3 w-36 flex-1`} />
          <div className={`${skeletonItemStyle} h-3 w-20`} />
          <div className={`${skeletonItemStyle} h-3 w-12`} />
        </div>
      ))}
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-3">
      <div className={`${skeletonItemStyle} h-4 w-3/4`} />
      <div className={`${skeletonItemStyle} h-4 w-full`} />
      <div className={`${skeletonItemStyle} h-4 w-5/6`} />
      <div className={`${skeletonItemStyle} h-4 w-2/3`} />
      <div className={`${skeletonItemStyle} h-4 w-4/5`} />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-[#27272a] p-6 bg-[#09090b] text-center">
          <div className={`${skeletonItemStyle} h-3 w-20 mx-auto mb-4`} />
          <div className={`${skeletonItemStyle} h-8 w-16 mx-auto`} />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ type, count = 1 }: LoadingSkeletonProps) {
  const elements = Array.from({ length: count });

  const Component = (() => {
    switch (type) {
      case "card":
        return CardSkeleton;
      case "list":
        return ListSkeleton;
      case "text":
        return TextSkeleton;
      case "stats":
        return StatsSkeleton;
      default:
        return CardSkeleton;
    }
  })();

  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      {elements.map((_, i) => (
        <Component key={i} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
