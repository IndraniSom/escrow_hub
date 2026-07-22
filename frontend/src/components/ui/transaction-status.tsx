"use client";

type TransactionStatusVariant = "idle" | "pending" | "confirming" | "success" | "error";

interface TransactionStatusProps {
  status: TransactionStatusVariant;
  message?: string;
  txHash?: string;
}

function Spinner() {
  return (
    <div className="inline-block w-4 h-4 border border-t-transparent border-[#ea580c] rounded-full animate-spin" />
  );
}

function Checkmark() {
  return (
    <div className="w-5 h-5 flex items-center justify-center text-[#22c55e] font-bold text-sm">
      &#10003;
    </div>
  );
}

function ErrorIcon() {
  return <div className="w-5 h-5 flex items-center justify-center text-[#ef4444] font-bold text-sm">!</div>;
}

const borderStyle: Record<TransactionStatusVariant, string> = {
  idle: "border-[#27272a]",
  pending: "border-[#ea580c]",
  confirming: "border-[#ea580c]",
  success: "border-[#22c55e]",
  error: "border-[#ef4444]",
};

const defaultMessages: Record<TransactionStatusVariant, string> = {
  idle: "Awaiting action...",
  pending: "Transaction pending...",
  confirming: "Confirming transaction...",
  success: "Transaction successful",
  error: "Transaction failed",
};

export default function TransactionStatus({
  status,
  message,
  txHash,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  const IconComponent = status === "pending" || status === "confirming"
    ? Spinner
    : status === "success" ? Checkmark : ErrorIcon;

  return (
    <div className={`flex items-center gap-3 p-3 border ${borderStyle[status]} bg-[#09090b]`}>
      <div className="flex-shrink-0">
        <IconComponent />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#fafafa] text-sm font-medium font-mono">
          {message || defaultMessages[status]}
        </p>
        {txHash && (
          <p className="text-[#a1a1aa] text-xs font-mono mt-0.5 truncate">
            TX: {txHash.slice(0, 18)}...{txHash.slice(-6)}
          </p>
        )}
      </div>
    </div>
  );
}
