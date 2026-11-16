"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  PlusCircle,
  Power,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  SubmissionFormat,
  SubmissionStatus,
  Task,
  TaskAttachment,
  TaskCategory,
  TaskDifficulty,
} from "@/lib/types";
import { formatFileSize, uploadToCloudinary } from "@/lib/cloudinary";
import { WINGPOLL_DOMAIN } from "@/lib/firebase";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";

type AgentAdminSection =
  | "overview"
  | "manage_tasks"
  | "create_task"
  | "submissions";

const AGENT_ADMIN_NAV: {
  id: AgentAdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "manage_tasks", label: "Manage Tasks", icon: Briefcase },
    { id: "create_task", label: "Create Task", icon: PlusCircle },
    { id: "submissions", label: "Task Submissions", icon: ClipboardCheck },
  ];

export default function AgentAdminPage() {
  const {
    user,
    firebaseUser,
    authLoading,
    logoutUser,
    tasks,
    submissions,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskActive,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AgentAdminSection>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<
    "ALL" | SubmissionStatus
  >("ALL");
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as AgentAdminSection | null;
      if (tab && AGENT_ADMIN_NAV.some((n) => n.id === tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Create / Edit Task State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskCategory, setTaskCategory] =
    useState<TaskCategory>("Email Extraction");
  const [taskReward, setTaskReward] = useState(75);
  const [taskTime, setTaskTime] = useState("15 mins");
  const [taskDifficulty, setTaskDifficulty] =
    useState<TaskDifficulty>("Easy");
  const [taskSlots, setTaskSlots] = useState(30);
  const [taskDeadline, setTaskDeadline] = useState("2026-11-25");
  const [taskFormat, setTaskFormat] =
    useState<SubmissionFormat>("multiline_text");
  const [taskAttachmentName, setTaskAttachmentName] = useState(
    "Scanned_Batch_Document.png"
  );
  const [taskAttachmentType, setTaskAttachmentType] =
    useState<TaskAttachment["type"]>("image");
  const [taskAttachmentSize, setTaskAttachmentSize] = useState("1.1 MB");
  const [taskAttachmentUrl, setTaskAttachmentUrl] = useState<string>("");
  const [taskCloudinaryId, setTaskCloudinaryId] = useState<string>("");
  const [isUploadingTaskFile, setIsUploadingTaskFile] = useState(false);
  const [taskUploadError, setTaskUploadError] = useState<string | null>(null);
  const [taskSampleContentText, setTaskSampleContentText] = useState(
    "1. Contact: info@kenyabusiness.co.ke | Tel: 0722 000 111\n2. Record verified for extraction."
  );
  const [taskInstructionsText, setTaskInstructionsText] = useState(
    "Download or preview the attached file.\nExtract all required records accurately.\nSubmit your structured answer for review."
  );
  const [taskToast, setTaskToast] = useState<string | null>(null);

  const visibleTasks =
    user.role === "admin"
      ? tasks
      : tasks.filter((t) => t.createdBy === user.id);
  const visibleTaskIds = new Set(visibleTasks.map((t) => t.id));
  const visibleSubmissions =
    user.role === "admin"
      ? submissions
      : submissions.filter((s) => visibleTaskIds.has(s.taskId));

  const activeTasksCount = visibleTasks.filter((t) => t.active).length;
  const pendingSubmissionsCount = visibleSubmissions.filter(
    (s) => s.status === "Pending Review"
  ).length;
  const revisionSubmissionsCount = visibleSubmissions.filter(
    (s) => s.status === "Revision Required"
  ).length;
  const approvedSubmissionsCount = visibleSubmissions.filter(
    (s) => s.status === "Approved"
  ).length;

  const filteredSubmissions =
    submissionFilter === "ALL"
      ? visibleSubmissions
      : visibleSubmissions.filter((s) => s.status === submissionFilter);

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDesc(task.shortDescription);
    setTaskCategory(task.category);
    setTaskReward(task.reward);
    setTaskTime(task.estimatedTime);
    setTaskDifficulty(task.difficulty);
    setTaskSlots(task.availableSlots);
    setTaskDeadline(task.deadline);
    setTaskFormat(task.submissionFormat);
    setTaskAttachmentName(task.attachment.name);
    setTaskAttachmentType(task.attachment.type);
    setTaskAttachmentSize(task.attachment.size || "1.1 MB");
    setTaskAttachmentUrl(task.attachment.previewUrl || "");
    setTaskCloudinaryId(task.attachment.cloudinaryPublicId || "");
    setTaskSampleContentText((task.attachment.sampleContent || []).join("\n"));
    setTaskInstructionsText(task.instructions.join("\n"));
    setActiveTab("create_task");
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDesc("");
    setTaskAttachmentUrl("");
    setTaskCloudinaryId("");
    setTaskUploadError(null);
  };

  const handleTaskFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTaskUploadError(null);
    setIsUploadingTaskFile(true);
    setTaskAttachmentName(file.name);
    setTaskAttachmentSize(formatFileSize(file.size));

    if (file.type.startsWith("video/")) {
      setTaskAttachmentType("video");
      if (taskCategory !== "Video Extraction") {
        setTaskCategory("Video Extraction");
      }
    } else if (file.type.startsWith("image/")) {
      setTaskAttachmentType("image");
    } else if (file.type === "application/pdf") {
      setTaskAttachmentType("pdf");
    }

    try {
      const uploaded = await uploadToCloudinary(file, "wingpoll_tasks");
      setTaskAttachmentUrl(uploaded.secureUrl);
      setTaskCloudinaryId(uploaded.publicId);
      setTaskAttachmentSize(formatFileSize(uploaded.bytes || file.size));
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf") ||
        uploaded.format === "pdf"
      ) {
        setTaskAttachmentType("pdf");
      } else if (uploaded.resourceType === "video") {
        setTaskAttachmentType("video");
      } else if (uploaded.resourceType === "image") {
        setTaskAttachmentType("image");
      }
    } catch (err) {
      setTaskUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload file to Cloudinary."
      );
    } finally {
      setIsUploadingTaskFile(false);
    }
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const instructionsList = taskInstructionsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const sampleContentList = taskSampleContentText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const attachmentObj: TaskAttachment = {
      name:
        taskAttachmentName ||
        (taskAttachmentType === "video"
          ? "Task_Source_Video.mp4"
          : "Task_Source_File.png"),
      size: taskAttachmentSize || "1.2 MB",
      type: taskAttachmentType,
      previewUrl: taskAttachmentUrl || undefined,
      cloudinaryPublicId: taskCloudinaryId || undefined,
      sampleContent:
        sampleContentList.length > 0
          ? sampleContentList
          : [
            `SAMPLE CONTENT FOR: ${taskTitle || "New Task"}`,
            "1. Contact: info@kenyabusiness.co.ke | Tel: 0722 000 111",
          ],
    };

    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: taskTitle,
        shortDescription: taskDesc,
        category: taskCategory,
        reward: Number(taskReward),
        estimatedTime: taskTime,
        difficulty: taskDifficulty,
        availableSlots: Number(taskSlots),
        deadline: taskDeadline,
        submissionFormat: taskFormat,
        instructions:
          instructionsList.length > 0
            ? instructionsList
            : ["Follow task instructions carefully."],
        attachment: attachmentObj,
      });
      setTaskToast("Task updated and saved to Firestore!");
      setEditingTaskId(null);
    } else {
      createTask({
        title: taskTitle || "New Digital Microtask",
        shortDescription:
          taskDesc ||
          "Complete the extraction instructions and submit for verification.",
        category: taskCategory,
        reward: Number(taskReward) || 60,
        estimatedTime: taskTime || "15 mins",
        difficulty: taskDifficulty,
        availableSlots: Number(taskSlots) || 25,
        totalSlots: Number(taskSlots) || 25,
        deadline: taskDeadline || "2026-11-30",
        active: true,
        submissionFormat: taskFormat,
        instructions:
          instructionsList.length > 0
            ? instructionsList
            : ["Complete the task and submit for review."],
        attachment: attachmentObj,
      });
      setTaskToast("New task created and saved to Firestore!");
    }

    resetTaskForm();
    setTimeout(() => {
      setTaskToast(null);
      setActiveTab("manage_tasks");
    }, 1200);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-sm w-full text-center space-y-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#16A34A] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">
            Verifying Agent Admin Session...
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F0FDF4] border border-emerald-200 text-[#14532D] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-slate-900">
              Agent Admin Sign-In Required
            </h1>
            <p className="text-xs text-slate-500">
              Sign in with an Agent Admin or Super Admin account to create tasks
              and review submissions.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] rounded-md transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const hasAccess = user.role === "agent-admin" || user.role === "admin";
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-slate-900">
              Agent Admin Access Required
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are signed in as{" "}
              <strong className="text-slate-800">
                {user.email || firebaseUser.email}
              </strong>{" "}
              with role{" "}
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                {user.role || "user"}
              </span>
              . Ask a Super Admin to promote your account to{" "}
              <code className="font-mono text-[#14532D] font-semibold">
                agent-admin
              </code>{" "}
              to access this workspace.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`${WINGPOLL_DOMAIN}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] rounded-md transition-colors"
            >
              Go to User Dashboard
            </a>
            <button
              type="button"
              onClick={async () => {
                await logoutUser();
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Agent Admin Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:sticky lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex flex-col items-start">
            <img
              src="/logo.png"
              alt="WingPoll"
              className="h-7 w-auto object-contain object-left"
            />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[#16A34A] mt-0.5">
              AGENT ADMIN CONSOLE
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {AGENT_ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "create_task" && activeTab !== "create_task") {
                    resetTaskForm();
                  }
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${active
                  ? "bg-[#14532D] text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${active ? "text-emerald-300" : "text-slate-400"
                      }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === "submissions" && pendingSubmissionsCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${active
                      ? "bg-white text-[#14532D]"
                      : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {pendingSubmissionsCount}
                  </span>
                )}
              </button>
            );
          })}

          {user.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium text-[#14532D] bg-[#F0FDF4] hover:bg-emerald-100 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>Super Admin Console</span>
              </Link>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 space-y-1.5 bg-slate-50/50">
          <button
            type="button"
            onClick={async () => {
              await logoutUser();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-red-600 bg-red-50/70 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md border border-slate-200 text-slate-600"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                Agent Admin — Tasks &amp; Submissions
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Create microtasks, manage active listings, and review earner
                submissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Agent Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                aria-label="Agent notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingSubmissionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingSubmissionsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Pending Reviews
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs">
                    {pendingSubmissionsCount === 0 ? (
                      <p className="p-4 text-center text-slate-400">
                        No pending submissions to review.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("submissions");
                          setNotifOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-medium text-slate-800">
                          Task submissions to review
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {pendingSubmissionsCount}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex flex-col items-end border-l border-slate-200 pl-3">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {user.name}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight">
                {user.email}
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#14532D] border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>
                {user.role === "admin" ? "Super Admin" : "Agent Admin"}
              </span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                  title="Your Tasks"
                  value={String(visibleTasks.length)}
                  subtitle={`${activeTasksCount} active in marketplace`}
                  icon={<Briefcase className="w-4 h-4" />}
                  highlighted
                />
                <StatsCard
                  title="Pending Submissions"
                  value={String(pendingSubmissionsCount)}
                  subtitle="Awaiting your review"
                  icon={<ClipboardCheck className="w-4 h-4" />}
                />
                <StatsCard
                  title="Revision Required"
                  value={String(revisionSubmissionsCount)}
                  subtitle="Returned for corrections"
                  icon={<Edit3 className="w-4 h-4" />}
                />
                <StatsCard
                  title="Approved Submissions"
                  value={String(approvedSubmissionsCount)}
                  subtitle="Completed & rewarded"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetTaskForm();
                    setActiveTab("create_task");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded-md cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("submissions")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 hover:border-[#16A34A] text-slate-800 rounded-md cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>
                    Review Submissions ({pendingSubmissionsCount} Pending)
                  </span>
                </button>
              </div>

              {/* Recent Submissions Queue */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Recent Task Submissions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Latest earner work waiting for Agent Admin verification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("submissions")}
                    className="text-xs font-semibold text-[#16A34A] hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Task</th>
                        <th className="py-3 px-4">Earner</th>
                        <th className="py-3 px-4">Reward</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {visibleSubmissions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 px-4 text-center text-slate-400"
                          >
                            No submissions yet for your tasks.
                          </td>
                        </tr>
                      ) : (
                        visibleSubmissions.slice(0, 6).map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">
                                {sub.taskTitle}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                {sub.submittedAt}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-800">
                                {sub.userName}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                {sub.userEmail}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-[#14532D] whitespace-nowrap">
                              KSh {sub.reward}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <StatusBadge status={sub.status} />
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <Link
                                href={`/admin/submissions/${sub.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-[#16A34A] hover:bg-[#15803d] text-white"
                              >
                                Review
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. MANAGE TASKS */}
          {activeTab === "manage_tasks" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Manage Marketplace Tasks
                  </h2>
                  <p className="text-xs text-slate-500">
                    Edit rewards, available slots, deadlines, or activate and
                    deactivate tasks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetTaskForm();
                    setActiveTab("create_task");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#16A34A] text-white rounded-md hover:bg-[#15803d] cursor-pointer self-start"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New Task</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Task Title</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Reward</th>
                        <th className="py-3.5 px-4">Slots</th>
                        <th className="py-3.5 px-4">Deadline</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {visibleTasks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 px-4 text-center text-slate-400"
                          >
                            You have not created any tasks yet. Click &ldquo;Create New Task&rdquo; to get started.
                          </td>
                        </tr>
                      ) : (
                        visibleTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">
                              {task.title}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Format: {task.submissionFormat} •{" "}
                              {task.attachment.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {task.category}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#14532D] whitespace-nowrap">
                            KSh {task.reward}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {task.availableSlots} / {task.totalSlots}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {task.deadline}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge
                              status={task.active ? "Active" : "Inactive"}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditTask(task)}
                                className="p-1.5 text-slate-600 hover:text-[#16A34A] bg-slate-100 rounded cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleTaskActive(task.id)}
                                className="p-1.5 text-slate-600 hover:text-amber-600 bg-slate-100 rounded cursor-pointer"
                                title={
                                  task.active
                                    ? "Deactivate Task"
                                    : "Activate Task"
                                }
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 text-slate-600 hover:text-red-600 bg-slate-100 rounded cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. CREATE / EDIT TASK */}
          {activeTab === "create_task" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingTaskId
                      ? `Edit Task (${editingTaskId})`
                      : "Create New Microtask"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure task instructions, reward in KSh, attachment file,
                    and submission format.
                  </p>
                </div>
                {editingTaskId && (
                  <button
                    type="button"
                    onClick={resetTaskForm}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Switch to New Task
                  </button>
                )}
              </div>

              {taskToast && (
                <div className="p-3 rounded-md bg-[#F0FDF4] border border-emerald-200 text-xs font-semibold text-[#14532D]">
                  {taskToast}
                </div>
              )}

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Extract Email Addresses From Scanned Business Directory"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-[#16A34A]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Short Summary Description *
                    </label>
                    <input
                      type="text"
                      required
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Brief explanation shown on marketplace task card..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Task Category
                    </label>
                    <select
                      value={taskCategory}
                      onChange={(e) => {
                        const cat = e.target.value as TaskCategory;
                        setTaskCategory(cat);
                        if (cat === "Video Extraction") {
                          setTaskAttachmentType("video");
                          setTaskAttachmentName("Business_Clip_Task.mp4");
                          setTaskInstructionsText(
                            "Watch the attached task video carefully.\nPause at key frames and extract all requested names, contacts, or figures from the video.\nEnter the extracted information into the submission form.\nSubmit your work for verification."
                          );
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    >
                      <option value="Video Extraction">
                        Video Extraction (Extract Info From Video)
                      </option>
                      <option value="Email Extraction">Email Extraction</option>
                      <option value="Image to Text">Image to Text</option>
                      <option value="Data Entry">Data Entry</option>
                      <option value="Document Formatting">
                        Document Formatting
                      </option>
                      <option value="PDF Creation">PDF Creation</option>
                      <option value="Text Transcription">
                        Text Transcription
                      </option>
                      <option value="Information Sorting">
                        Information Sorting
                      </option>
                      <option value="Simple Research">Simple Research</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reward Amount (KSh)
                    </label>
                    <input
                      type="number"
                      min={10}
                      required
                      value={taskReward}
                      onChange={(e) => setTaskReward(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      placeholder="e.g. 15 mins"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={taskDifficulty}
                      onChange={(e) =>
                        setTaskDifficulty(e.target.value as TaskDifficulty)
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Available Slots
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={taskSlots}
                      onChange={(e) => setTaskSlots(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Submission Format
                    </label>
                    <select
                      value={taskFormat}
                      onChange={(e) =>
                        setTaskFormat(e.target.value as SubmissionFormat)
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    >
                      <option value="multiline_text">Multiline Text</option>
                      <option value="text_input">Single Line Text</option>
                      <option value="structured_table">Structured Table</option>
                      <option value="file_upload">File Upload</option>
                      <option value="pdf_upload">PDF Upload</option>
                      <option value="multiple_fields">Multiple Fields</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Attachment Type
                    </label>
                    <select
                      value={taskAttachmentType}
                      onChange={(e) =>
                        setTaskAttachmentType(
                          e.target.value as TaskAttachment["type"]
                        )
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF Document</option>
                      <option value="document">Word / Text Document</option>
                      <option value="spreadsheet">Spreadsheet</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Upload Source File (Image, Video, or PDF)
                    </label>
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-md">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded cursor-pointer hover:border-[#16A34A] text-slate-700">
                        <Upload className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>
                          {isUploadingTaskFile
                            ? "Uploading..."
                            : "Choose File to Upload"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*,application/pdf"
                          onChange={handleTaskFileUpload}
                          disabled={isUploadingTaskFile}
                        />
                      </label>
                      <span className="text-xs text-slate-500">
                        {taskAttachmentUrl
                          ? `Uploaded: ${taskAttachmentName} (${taskAttachmentSize})`
                          : `${taskAttachmentName} (${taskAttachmentSize})`}
                      </span>
                    </div>
                    {taskUploadError && (
                      <p className="text-xs text-red-600 mt-1">
                        {taskUploadError}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Step-by-Step Instructions (one step per line)
                    </label>
                    <textarea
                      rows={4}
                      value={taskInstructionsText}
                      onChange={(e) => setTaskInstructionsText(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-[#16A34A]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sample / Reference Content (one line per item)
                    </label>
                    <textarea
                      rows={3}
                      value={taskSampleContentText}
                      onChange={(e) => setTaskSampleContentText(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isUploadingTaskFile}
                    className="px-5 py-2.5 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded-md cursor-pointer disabled:opacity-60"
                  >
                    {editingTaskId ? "Update Task" : "Publish Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetTaskForm();
                      setActiveTab("manage_tasks");
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. TASK SUBMISSIONS */}
          {activeTab === "submissions" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Task Submissions Moderation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click &ldquo;Review&rdquo; on any submission to open its
                    review page and Approve, Request Corrections, or Reject.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      "ALL",
                      "Pending Review",
                      "Revision Required",
                      "Approved",
                      "Rejected",
                    ] as const
                  ).map((filterVal) => (
                    <button
                      key={filterVal}
                      type="button"
                      onClick={() => setSubmissionFilter(filterVal)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${submissionFilter === filterVal
                        ? "bg-[#14532D] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {filterVal === "ALL" ? "All" : filterVal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Submission / Task</th>
                        <th className="py-3.5 px-4">Earner</th>
                        <th className="py-3.5 px-4">Submitted Date</th>
                        <th className="py-3.5 px-4">Reward</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">
                          Review Submission
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 px-4 text-center text-slate-400"
                          >
                            No matching submissions found.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-900">
                                {sub.taskTitle}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                #{sub.id} • {sub.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-medium text-slate-800">
                                {sub.userName}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                {sub.userEmail}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {sub.submittedAt}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#14532D] whitespace-nowrap">
                              KSh {sub.reward}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <StatusBadge status={sub.status} />
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <Link
                                href={`/admin/submissions/${sub.id}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#16A34A] hover:bg-[#15803d] text-white transition-colors"
                              >
                                <ClipboardCheck className="w-3.5 h-3.5" />
                                <span>Review</span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

