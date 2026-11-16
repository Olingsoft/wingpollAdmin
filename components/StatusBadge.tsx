import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-500";

  if (
    normalized === "approved" ||
    normalized === "completed" ||
    normalized === "active" ||
    normalized === "easy"
  ) {
    colorClasses = "bg-[#F0FDF4] text-[#14532D] border-emerald-200";
    dotColor = "bg-[#16A34A]";
  } else if (
    normalized === "pending review" ||
    normalized === "pending approval" ||
    normalized === "processing" ||
    normalized === "pending" ||
    normalized === "pending first task" ||
    normalized === "medium"
  ) {
    colorClasses = "bg-amber-50 text-amber-800 border-amber-200";
    dotColor = "bg-amber-500";
  } else if (normalized === "revision required") {
    colorClasses = "bg-blue-50 text-blue-800 border-blue-200";
    dotColor = "bg-blue-600";
  } else if (
    normalized === "rejected" ||
    normalized === "failed" ||
    normalized === "suspended" ||
    normalized === "inactive" ||
    normalized === "hard"
  ) {
    colorClasses = "bg-red-50 text-red-700 border-red-200";
    dotColor = "bg-red-500";
  }

  const padding =
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${padding} ${colorClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

