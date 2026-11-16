"use client";

import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Transaction } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";

interface TransactionTableProps {
  transactions: Transaction[];
  limit?: number;
}

export function TransactionTable({
  transactions,
  limit,
}: TransactionTableProps) {
  const rows = limit ? transactions.slice(0, limit) : transactions;

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No transactions found"
        description="No transactions match your current filter criteria."
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {rows.map((txn) => {
              const isPositive = txn.amount > 0;
              return (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                    {txn.reference}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {txn.date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">
                    {txn.description}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                      {isPositive ? (
                        <ArrowDownLeft className="w-3 h-3 text-[#16A34A]" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-slate-600" />
                      )}
                      {txn.type}
                    </span>
                  </td>
                  <td
                    className={`py-3.5 px-4 font-bold whitespace-nowrap ${
                      isPositive ? "text-[#16A34A]" : "text-slate-900"
                    }`}
                  >
                    {isPositive ? "+" : "-"}KSh{" "}
                    {Math.abs(txn.amount).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <StatusBadge status={txn.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

