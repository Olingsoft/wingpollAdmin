"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { StatusBadge } from "@/components/StatusBadge";

function AdminSubmissionReviewContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    user,
    firebaseUser,
    authLoading,
    allUsers,
    tasks,
    submissions,
    reviewSubmission,
  } = useApp();

  const submission = submissions.find((s) => s.id === params.id);
  const task = tasks.find((t) => t.id === submission?.taskId);
  const earner = allUsers.find((u) => u.id === submission?.userId);

  const [feedback, setFeedback] = useState(submission?.feedback || "");
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [decisionBanner, setDecisionBanner] = useState<{
    type: "approved" | "revision" | "rejected";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // 1. Wait for Firebase Auth & Firestore User Profile
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-sm w-full text-center space-y-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#16A34A] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">
            Loading Admin Submission Review...
          </p>
        </div>
      </div>
    );
  }

  const canReviewSubmissions =
    user.role === "admin" || user.role === "agent-admin";
  const submissionsBackHref =
    user.role === "agent-admin"
      ? "/agent-admin?tab=submissions"
      : "/admin?tab=submissions";

  // 2. Check if logged in and role is admin or agent-admin
  if (!firebaseUser || !canReviewSubmissions) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Admin Access Required
          </h1>
          <p className="text-xs text-slate-600">
            Only administrators can review earner task submissions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-md hover:bg-[#15803d]"
          >
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <Link
            href={submissionsBackHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#16A34A]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Task Submissions</span>
          </Link>
        </header>
        <main className="flex-1 p-6 max-w-3xl w-full mx-auto flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3 w-full">
            <p className="text-sm font-bold text-slate-900">
              Submission #{params.id} not found
            </p>
            <p className="text-xs text-slate-500">
              This submission may have been cancelled by the earner or removed.
            </p>
            <Link
              href={submissionsBackHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-md hover:bg-[#15803d]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Submissions Queue</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 3. If Agent Admin, ensure they can only review submissions for tasks they created
  if (
    submission &&
    user.role === "agent-admin" &&
    (!task || task.createdBy !== user.id)
  ) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Access Denied — Task Ownership Required
          </h1>
          <p className="text-xs text-slate-600">
            As an Agent Admin, you can only review submissions for tasks that
            you created.
          </p>
          <Link
            href="/agent-admin?tab=submissions"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-md hover:bg-[#15803d]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Your Submissions</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    const finalFeedback =
      feedback.trim() ||
      "Approved by admin! Accurate work — reward credited to your account.";
    reviewSubmission(submission.id, "Approved", finalFeedback);
    setDecisionBanner({
      type: "approved",
      title: `Submission Approved — KSh ${submission.reward.toLocaleString()} Granted!`,
      message: `KSh ${submission.reward.toLocaleString()} has been credited directly to ${submission.userName}'s Available Balance in Firestore.`,
    });
  };

  const openCorrectionModal = () => {
    setCorrectionNote(feedback.trim());
    setCorrectionError(null);
    setCorrectionModalOpen(true);
  };

  const handleRequestCorrections = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNote = correctionNote.trim();
    if (!trimmedNote) {
      setCorrectionError(
        "Please provide a note explaining what the earner should correct."
      );
      return;
    }
    setFeedback(trimmedNote);
    reviewSubmission(submission.id, "Revision Required", trimmedNote);
    setCorrectionModalOpen(false);
    setDecisionBanner({
      type: "revision",
      title: "Corrections Requested Successfully!",
      message: `${submission.userName} has been notified with your correction notes. Redirecting back to submissions...`,
    });
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    redirectTimerRef.current = setTimeout(() => {
      router.push(submissionsBackHref);
    }, 1200);
  };

  const handleReject = () => {
    const finalFeedback =
      feedback.trim() ||
      "Submission rejected during quality verification. Did not match the source material.";
    reviewSubmission(submission.id, "Rejected", finalFeedback);
    setDecisionBanner({
      type: "rejected",
      title: "Submission Rejected",
      message: `Submission #${submission.id} by ${submission.userName} has been marked as Rejected.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={submissionsBackHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Submissions</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
            <h1 className="text-sm sm:text-base font-bold text-slate-900">
              Admin Submission Review{" "}
              <span className="text-slate-400 font-mono text-xs">
                #{submission.id}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={submission.status} size="md" />
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Decision Feedback Banner */}
        {decisionBanner && (
          <div
            className={`p-4 sm:p-5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
              decisionBanner.type === "approved"
                ? "bg-[#F0FDF4] border-emerald-300 text-[#14532D]"
                : decisionBanner.type === "revision"
                ? "bg-blue-50 border-blue-200 text-blue-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-start gap-3">
              {decisionBanner.type === "approved" ? (
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
              ) : decisionBanner.type === "revision" ? (
                <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h2 className="text-sm font-bold">{decisionBanner.title}</h2>
                <p className="text-xs opacity-90">{decisionBanner.message}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(submissionsBackHref)}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              Back to All Submissions →
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Submission Info, Earner's Submitted Work & Original Task Source */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Submission & Earner Overview Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    <Layers className="w-3.5 h-3.5 text-[#16A34A]" />
                    {submission.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    SUBMISSION #{submission.id}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-[#F0FDF4] border border-emerald-200 text-[#14532D] font-bold text-base">
                  Task Reward: KSh {submission.reward.toLocaleString()}
                </div>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {submission.taskTitle}
                </h2>
                {task?.shortDescription && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {task.shortDescription}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 space-y-0.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#16A34A]" />
                    Submitted By Earner
                  </span>
                  <p className="font-bold text-slate-900">
                    {submission.userName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {submission.userEmail}
                  </p>
                </div>

                <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 space-y-0.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#16A34A]" />
                    Submission Timestamp
                  </span>
                  <p className="font-bold text-slate-900">
                    {submission.submittedAt}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Format:{" "}
                    {submission.submittedData.format.replace(/_/g, " ")}
                  </p>
                </div>

                <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 space-y-0.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-[#16A34A]" />
                    Earner Account Balance
                  </span>
                  <p className="font-bold text-[#14532D]">
                    KSh {(earner?.availableBalance ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Completed Tasks: {earner?.completedTasks ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Earner's Submitted Work (Full Inspection) */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#16A34A]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Earner&apos;s Submitted Work
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase">
                  {submission.submittedData.format.replace(/_/g, " ")}
                </span>
              </div>

              {/* Text Answer (Single or Multiline) */}
              {submission.submittedData.textAnswer && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Submitted Text / Transcription:
                  </span>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
                    {submission.submittedData.textAnswer}
                  </pre>
                </div>
              )}

              {/* Structured Table Rows */}
              {submission.submittedData.tableRows &&
                submission.submittedData.tableRows.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Submitted Structured Table Data (
                      {submission.submittedData.tableRows.length} rows):
                    </span>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                            <th className="py-2.5 px-3 w-10">#</th>
                            {Object.keys(
                              submission.submittedData.tableRows[0]
                            ).map((col) => (
                              <th key={col} className="py-2.5 px-3">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {submission.submittedData.tableRows.map(
                            (row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 font-mono text-slate-400">
                                  {idx + 1}
                                </td>
                                {Object.values(row).map((val, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="py-2 px-3 text-slate-800"
                                  >
                                    {val || "—"}
                                  </td>
                                ))}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Multiple Input Fields */}
              {submission.submittedData.fieldValues && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Submitted Field Values:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                    {Object.entries(submission.submittedData.fieldValues).map(
                      ([key, val]) => (
                        <div
                          key={key}
                          className="bg-white p-3 rounded border border-slate-200/80"
                        >
                          <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                            {key}
                          </span>
                          <span className="font-semibold text-slate-900 mt-0.5 block">
                            {val || "—"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded File (with Inline Preview) */}
              {submission.submittedData.fileName && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Submitted File Attachment:
                  </span>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <FileText className="w-4 h-4 text-[#16A34A]" />
                      <span>{submission.submittedData.fileName}</span>
                      {submission.submittedData.fileSize && (
                        <span className="text-slate-400 font-normal">
                          ({submission.submittedData.fileSize})
                        </span>
                      )}
                    </div>
                    {submission.submittedData.fileUrl && (
                      <a
                        href={submission.submittedData.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#16A34A] text-white rounded-md hover:bg-[#15803d]"
                      >
                        <span>Open Full File</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {submission.submittedData.fileUrl &&
                    submission.submittedData.fileUrl.match(/\.pdf(\?|$)/i) && (
                      <iframe
                        src={submission.submittedData.fileUrl}
                        title={submission.submittedData.fileName}
                        className="w-full h-[500px] rounded-lg border border-slate-200 bg-white"
                      />
                    )}

                  {submission.submittedData.fileUrl &&
                    submission.submittedData.fileUrl.match(
                      /\.(png|jpe?g|webp|gif|svg)(\?|$)/i
                    ) && (
                      <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                        <img
                          src={submission.submittedData.fileUrl}
                          alt={submission.submittedData.fileName}
                          className="max-h-[480px] rounded mx-auto object-contain"
                        />
                      </div>
                    )}

                  {submission.submittedData.fileUrl &&
                    submission.submittedData.fileUrl.match(
                      /\.(mp4|webm|mov|ogg)(\?|$)/i
                    ) && (
                      <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                        <video
                          src={submission.submittedData.fileUrl}
                          controls
                          className="w-full max-h-[460px] object-contain"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Earner Notes */}
              {submission.submittedData.notes && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-semibold text-slate-800 block mb-1">
                    Additional Notes from Earner:
                  </span>
                  <p className="text-slate-600">
                    {submission.submittedData.notes}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Original Task Source Material & Instructions Reference */}
            {task && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {task.attachment.type === "video" ? (
                      <Film className="w-4 h-4 text-[#16A34A]" />
                    ) : task.attachment.type === "image" ? (
                      <ImageIcon className="w-4 h-4 text-[#16A34A]" />
                    ) : task.attachment.type === "spreadsheet" ? (
                      <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#16A34A]" />
                    )}
                    <h3 className="text-sm font-bold text-slate-900">
                      Original Task Reference: {task.attachment.name}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {task.attachment.type.toUpperCase()} •{" "}
                    {task.attachment.size}
                  </span>
                </div>

                {task.attachment.sampleContent &&
                  task.attachment.sampleContent.length > 0 && (
                    <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs space-y-1.5">
                      {task.attachment.sampleContent.map((line, i) => (
                        <p key={i} className="text-slate-200 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Moderation Decision Panel (Approve, Request Corrections, Reject) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-5 sticky top-22 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review Decision & Reward Payout
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify the earner&apos;s submission and choose an action
                  below.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#F0FDF4] border border-emerald-200 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
                  Reward to Credit on Approval
                </span>
                <p className="text-xl font-bold text-[#14532D]">
                  KSh {submission.reward.toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-800">
                  Approving grants KSh {submission.reward.toLocaleString()}{" "}
                  directly to <strong>{submission.userName}</strong>&apos;s
                  Available Balance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Moderator Feedback / Correction Notes
                </label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback, approval message, or instructions for corrections..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-[#16A34A]"
                />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={submission.status === "Approved"}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803d] disabled:opacity-50 rounded-md cursor-pointer transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submission.status === "Approved"
                      ? `Already Approved (KSh ${submission.reward} Granted)`
                      : `Approve & Grant KSh ${submission.reward.toLocaleString()}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openCorrectionModal}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Request Corrections</span>
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-md cursor-pointer transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Submission</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Request Corrections Note Dialog */}
      {correctionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => setCorrectionModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Request Corrections
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCorrectionModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Close correction dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestCorrections} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Provide clear instructions for{" "}
                <span className="font-semibold text-slate-900">
                  {submission.userName}
                </span>{" "}
                on what needs to be fixed in{" "}
                <span className="font-semibold text-slate-900">
                  {submission.taskTitle}
                </span>
                .
              </p>

              {correctionError && (
                <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {correctionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correction Note *
                </label>
                <textarea
                  rows={4}
                  required
                  value={correctionNote}
                  onChange={(e) => {
                    setCorrectionNote(e.target.value);
                    if (correctionError) setCorrectionError(null);
                  }}
                  placeholder="Explain the exact corrections needed so the earner can update and resubmit..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Send Correction Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSubmissionReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-sm w-full text-center space-y-3 shadow-xs">
            <Loader2 className="w-7 h-7 text-[#16A34A] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              Loading Submission Review...
            </p>
          </div>
        </div>
      }
    >
      <AdminSubmissionReviewContent />
    </Suspense>
  );
}

