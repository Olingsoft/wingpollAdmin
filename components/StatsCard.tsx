import React from "react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  highlighted?: boolean;
  trend?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  highlighted = false,
  trend,
}: StatsCardProps) {
  return (
    <div
      className={`rounded-lg border p-5 transition-all ${
        highlighted
          ? "bg-[#F0FDF4] border-emerald-200"
          : "bg-white border-slate-200"
      } shadow-[0_1px_2px_rgba(0,0,0,0.03)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-medium ${
              highlighted ? "text-[#14532D]" : "text-slate-500"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-2xl font-bold tracking-tight mt-1.5 ${
              highlighted ? "text-[#14532D]" : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
            highlighted
              ? "bg-[#16A34A] text-white"
              : "bg-[#F0FDF4] text-[#16A34A] border border-emerald-100"
          }`}
        >
          {icon}
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span className="font-medium text-[#16A34A]">{trend}</span>
          )}
        </div>
      )}
    </div>
  );
}

