"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  Loader2,
  PauseCircle,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { StatusBadge } from "@/components/StatusBadge";

function AdminWithdrawalReviewContent() {
  const params = useParams<{ id: string }>();
  const {
    user,
    firebaseUser,
    authLoading,
    allUsers,
    submissions,
    withdrawals,
    processWithdrawal,
    updateUserAccountStatus,
  } = useApp();

  const withdrawal = withdrawals.find((w) => w.id === params.id);
  const earner = allUsers.find((u) => u.id === withdrawal?.userId);

  const [notes, setNotes] = useState(withdrawal?.notes || "");
  const [actionBanner, setActionBanner] = useState<{
    type: "granted" | "hold" | "suspended";
    title: string;
    message: string;
  } | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-sm w-full text-center space-y-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#16A34A] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">
            Loading Withdrawal Review...
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Super Admin Access Required
          </h1>
          <p className="text-xs text-slate-600">
            Only Super Administrators can review and process withdrawal
            requests.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-md hover:bg-[#15803d]"
          >
            Sign In as Super Admin
          </Link>
        </div>
      </div>
    );
  }

  if (!withdrawal) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/admin?tab=withdrawals"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#16A34A]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Withdrawal Requests</span>
          </Link>
        </header>
        <main className="flex-1 p-6 max-w-3xl w-full mx-auto flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3 w-full">
            <p className="text-sm font-bold text-slate-900">
              Withdrawal #{params.id} not found
            </p>
            <p className="text-xs text-slate-500">
              This withdrawal request may have been removed or does not exist.
            </p>
            <Link
              href="/admin?tab=withdrawals"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-md hover:bg-[#15803d]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Withdrawals</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const approvedTaskSubmissions = submissions.filter(
    (s) => s.userId === withdrawal.userId && s.status === "Approved"
  );
  const completedTasksTotal = approvedTaskSubmissions.reduce(
    (sum, s) => sum + s.reward,
    0
  );
  const referralBonusTotal = earner?.referralEarnings ?? 0;
  const combinedVerifiedEarnings = completedTasksTotal + referralBonusTotal;

  const handleGrant = () => {
    const finalNotes =
      notes.trim() || `M-Pesa payout approved and granted by ${user.name}.`;
    processWithdrawal(withdrawal.id, "Completed", finalNotes);
    setActionBanner({
      type: "granted",
      title: `Withdrawal Granted — KSh ${withdrawal.amount.toLocaleString()}`,
      message: `Marked ${withdrawal.reference} as Completed for ${withdrawal.userName} (${withdrawal.mpesaNumber}).`,
    });
  };

  const handleHold = () => {
    const finalNotes =
      notes.trim() ||
      "Withdrawal placed on hold by Super Admin for earnings verification.";
    processWithdrawal(withdrawal.id, "On Hold", finalNotes);
    setActionBanner({
      type: "hold",
      title: "Withdrawal Placed On Hold",
      message: `${withdrawal.reference} is now On Hold. The earner has been notified.`,
    });
  };

  const handleSuspend = async () => {
    const finalNotes =
      notes.trim() ||
      "Account suspended by Super Admin during withdrawal audit.";
    if (earner) {
      await updateUserAccountStatus(earner.id, "Suspended");
    }
    if (withdrawal.status === "Processing") {
      processWithdrawal(withdrawal.id, "On Hold", finalNotes);
    }
    setActionBanner({
      type: "suspended",
      title: `Account Suspended — ${withdrawal.userName}`,
      message: `${withdrawal.userName}'s account has been suspended and this withdrawal is held for review.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin?tab=withdrawals"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Withdrawals</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <CreditCard className="w-4 h-4 text-[#16A34A]" />
            <span className="font-semibold text-slate-800">
              Withdrawal Audit #{withdrawal.reference}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
            <p className="text-[11px] text-slate-500">{user.email}</p>
          </div>
          <StatusBadge status={withdrawal.status} size="md" />
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {actionBanner && (
          <div
            className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              actionBanner.type === "granted"
                ? "bg-[#F0FDF4] border-emerald-200 text-[#14532D]"
                : actionBanner.type === "hold"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-sm font-bold">{actionBanner.title}</p>
              <p className="text-xs opacity-90">{actionBanner.message}</p>
            </div>
            <Link
              href="/admin?tab=withdrawals"
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-md text-slate-800 hover:bg-slate-50 shrink-0 self-start sm:self-auto"
            >
              Return to Withdrawals
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Completed Tasks Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Banner */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Requested Withdrawal
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  KSh {withdrawal.amount.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  M-Pesa: {withdrawal.mpesaNumber}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Approved Tasks Total
                </p>
                <p className="text-2xl font-bold text-[#16A34A] mt-1">
                  KSh {completedTasksTotal.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Across {approvedTaskSubmissions.length} approved task
                  {approvedTaskSubmissions.length === 1 ? "" : "s"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Verified Total (+ Referrals)
                </p>
                <p className="text-2xl font-bold text-[#14532D] mt-1">
                  KSh {combinedVerifiedEarnings.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Includes KSh {referralBonusTotal.toLocaleString()} referral
                  bonuses
                </p>
              </div>
            </div>

            {/* Completed Tasks Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#16A34A]" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Completed Tasks Breakdown
                    </h2>
                    <p className="text-xs text-slate-500">
                      All approved tasks completed by {withdrawal.userName} that
                      contribute to their withdrawable balance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Task Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {approvedTaskSubmissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 px-4 text-center text-slate-400"
                        >
                          No approved task submissions found for this user.
                        </td>
                      </tr>
                    ) : (
                      approvedTaskSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">
                              {sub.taskTitle}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              #{sub.id}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {sub.category}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {sub.submittedAt}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge status={sub.status} />
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#14532D] whitespace-nowrap">
                            KSh {sub.reward.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 text-xs">
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 px-4 font-semibold text-slate-700 text-right"
                      >
                        Total from Completed Tasks:
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16A34A] text-right whitespace-nowrap">
                        KSh {completedTasksTotal.toLocaleString()}
                      </td>
                    </tr>
                    {referralBonusTotal > 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-2.5 px-4 font-medium text-slate-600 text-right"
                        >
                          Referral Bonuses Earned:
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 text-right whitespace-nowrap">
                          + KSh {referralBonusTotal.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#F0FDF4]">
                      <td
                        colSpan={4}
                        className="py-3 px-4 font-bold text-[#14532D] text-right"
                      >
                        Requested Withdrawal Amount:
                      </td>
                      <td className="py-3 px-4 font-bold text-[#14532D] text-right whitespace-nowrap">
                        KSh {withdrawal.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Earner Info & Decision Controls */}
          <div className="space-y-6">
            {/* Earner Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-[#F0FDF4] border border-emerald-200 flex items-center justify-center text-[#16A34A]">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {withdrawal.userName}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {withdrawal.userEmail}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Status</span>
                  <StatusBadge status={earner?.status || "Active"} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">M-Pesa Number</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {withdrawal.mpesaNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Requested At</span>
                  <span className="text-slate-700 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {withdrawal.requestedAt}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Available Balance</span>
                  <span className="font-bold text-[#16A34A] inline-flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    KSh {(earner?.availableBalance ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Lifetime Earnings</span>
                  <span className="font-semibold text-slate-800">
                    KSh {(earner?.totalEarnings ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Decision Controls */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Withdrawal Decision
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Notes / M-Pesa Receipt
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional M-Pesa receipt code, hold reason, or suspension note..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleGrant}
                  className="w-full py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Grant Withdrawal</span>
                </button>

                <button
                  type="button"
                  onClick={handleHold}
                  className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                  <span>Hold Withdrawal</span>
                </button>

                <button
                  type="button"
                  onClick={handleSuspend}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Ban className="w-4 h-4 text-red-600" />
                  <span>Suspend Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminWithdrawalReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <Loader2 className="w-7 h-7 text-[#16A34A] animate-spin" />
        </div>
      }
    >
      <AdminWithdrawalReviewContent />
    </Suspense>
  );
}

