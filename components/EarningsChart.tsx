"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/context/AppContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EarningsChart() {
  const { user, transactions } = useApp();

  const chartData = useMemo(() => {
    const userTxns = transactions.filter(
      (t) =>
        (!t.userId || t.userId === user.id) &&
        t.status === "Completed" &&
        (t.type === "Task Reward" || t.type === "Referral Reward")
    );

    const dayBuckets = DAYS.map((day) => ({
      name: day,
      taskEarnings: 0,
      referralEarnings: 0,
    }));

    userTxns.forEach((t) => {
      const parsed = new Date(t.date);
      const dayIdx = Number.isNaN(parsed.getTime()) ? 0 : parsed.getDay();
      if (t.type === "Task Reward") {
        dayBuckets[dayIdx].taskEarnings += Math.max(0, t.amount);
      } else if (t.type === "Referral Reward") {
        dayBuckets[dayIdx].referralEarnings += Math.max(0, t.amount);
      }
    });

    return dayBuckets;
  }, [transactions, user.id]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Earnings Overview (KSh)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly breakdown of approved Task Rewards and Referral Commissions
          </p>
        </div>
        <div className="inline-flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A]" />
            Task Earnings
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#14532D]" />
            Referral Bonus
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "#CBD5E1" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [`KSh ${value}`, undefined]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", display: "none" }} />
            <Bar
              dataKey="taskEarnings"
              name="Task Earnings"
              fill="#16A34A"
              radius={[4, 4, 0, 0]}
              barSize={26}
            />
            <Bar
              dataKey="referralEarnings"
              name="Referral Earnings"
              fill="#14532D"
              radius={[4, 4, 0, 0]}
              barSize={26}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
