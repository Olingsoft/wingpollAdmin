"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Film,
  History,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Menu,
  MoreVertical,
  PlusCircle,
  Power,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  AdFormat,
  AdPosition,
  Submission,
  SubmissionFormat,
  Task,
  TaskAttachment,
  TaskCategory,
  TaskDifficulty,
} from "@/lib/types";
import { formatFileSize, uploadToCloudinary } from "@/lib/cloudinary";
import { getFirebaseAuthErrorMessage, WINGPOLL_DOMAIN } from "@/lib/firebase";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { TransactionTable } from "@/components/TransactionTable";
import { EarningsChart } from "@/components/EarningsChart";

type AdminSection =
  | "overview"
  | "manage_tasks"
  | "create_task"
  | "submissions"
  | "users"
  | "create_user"
  | "referrals"
  | "withdrawals"
  | "transactions"
  | "advertisements"
  | "reports"
  | "settings";

const ADMIN_NAV: {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "manage_tasks", label: "Manage Tasks", icon: Briefcase },
  { id: "create_task", label: "Create Task", icon: PlusCircle },
  { id: "submissions", label: "Task Submissions", icon: ClipboardCheck },
  { id: "users", label: "Manage Users", icon: Users },
  { id: "create_user", label: "Create Admin User", icon: UserPlus },
  { id: "referrals", label: "Referral Management", icon: UserCheck },
  { id: "withdrawals", label: "Withdrawal Requests", icon: CreditCard },
  { id: "transactions", label: "Transactions", icon: History },
  { id: "advertisements", label: "Advertisements", icon: Megaphone },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboardPage() {
  const {
    user,
    firebaseUser,
    authLoading,
    logoutUser,
    allUsers,
    tasks,
    submissions,
    withdrawals,
    transactions,
    referrals,
    ads,
    createAdminAccount,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskActive,
    reviewSubmission,
    processWithdrawal,
    createAd,
    toggleAdActive,
    deleteAd,
    toggleUserStatus,
    approveUserAccount,
    updateUserAccountStatus,
    updateUserRole,
    grantReferralBonusManual,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminSection>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userApprovalToast, setUserApprovalToast] = useState<string | null>(
    null
  );
  const [openUserMenuId, setOpenUserMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as AdminSection | null;
      if (tab && ADMIN_NAV.some((n) => n.id === tab)) {
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

  // Create Admin Account / Promote User State
  const [createUserMode, setCreateUserMode] = useState<"create" | "promote">(
    "promote"
  );
  const [selectedPromoteUserId, setSelectedPromoteUserId] = useState("");
  const [promoteUserSearch, setPromoteUserSearch] = useState("");
  const [isPromotingUser, setIsPromotingUser] = useState(false);
  const [adminFullName, setAdminFullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("0712345678");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRole, setAdminRole] = useState<"agent-admin" | "admin">(
    "agent-admin"
  );
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminFormStatus, setAdminFormStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Advertisement Creation State
  const [adTitle, setAdTitle] = useState("");
  const [adSponsor, setAdSponsor] = useState("");
  const [adDesc, setAdDesc] = useState("");
  const [adCta, setAdCta] = useState("Learn More");
  const [adFormat, setAdFormat] = useState<AdFormat>("banner");
  const [adVideoDuration, setAdVideoDuration] = useState("0:45");
  const [adPosition, setAdPosition] =
    useState<AdPosition>("task_list_banner");
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);

  // Platform Settings State
  const [minWithdrawalSetting, setMinWithdrawalSetting] = useState(300);
  const [referralBonusSetting, setReferralBonusSetting] = useState(50);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Overview Computed Metrics
  const totalRegisteredUsers = allUsers.length;
  const activeUsersCount = allUsers.filter((u) => u.status === "Active").length;
  const pendingUsersCount = allUsers.filter(
    (u) => u.status === "Pending Approval"
  ).length;
  const totalTasksCount = tasks.length;
  const pendingSubmissionsCount = submissions.filter(
    (s) => s.status === "Pending Review"
  ).length;
  const approvedSubmissionsCount = submissions.filter(
    (s) => s.status === "Approved"
  ).length;
  const pendingWithdrawalsCount = withdrawals.filter(
    (w) => w.status === "Processing"
  ).length;
  const totalRewardsIssued = allUsers.reduce(
    (sum, u) => sum + u.totalEarnings,
    0
  );

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

  const handlePromoteUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormStatus(null);
    if (!selectedPromoteUserId) {
      setAdminFormStatus({
        type: "error",
        message: "Please select a user from the list to promote.",
      });
      return;
    }
    const targetUser = allUsers.find((u) => u.id === selectedPromoteUserId);
    if (!targetUser) {
      setAdminFormStatus({
        type: "error",
        message: "Selected user could not be found.",
      });
      return;
    }
    setIsPromotingUser(true);
    try {
      await updateUserRole(targetUser.id, adminRole);
      const roleLabel =
        adminRole === "agent-admin"
          ? "Agent Admin (agent-admin)"
          : "Super Admin (admin)";
      setAdminFormStatus({
        type: "success",
        message: `${targetUser.name} (${targetUser.email}) has been promoted to ${roleLabel}.`,
      });
      setSelectedPromoteUserId("");
      setPromoteUserSearch("");
    } catch (err) {
      setAdminFormStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to promote user.",
      });
    } finally {
      setIsPromotingUser(false);
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormStatus(null);
    if (!adminFullName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setAdminFormStatus({
        type: "error",
        message: "Please fill in full name, email, and password.",
      });
      return;
    }
    setIsCreatingAdmin(true);
    try {
      const createdAdmin = await createAdminAccount({
        fullName: adminFullName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: adminRole,
      });
      const roleLabel =
        createdAdmin.role === "agent-admin"
          ? "Agent Admin (agent-admin)"
          : "Super Admin (admin)";
      setAdminFormStatus({
        type: "success",
        message: `${roleLabel} account created for ${createdAdmin.name} (${createdAdmin.email}) and saved to Firestore users table.`,
      });
      setAdminFullName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminRole("agent-admin");
    } catch (err) {
      setAdminFormStatus({
        type: "error",
        message: getFirebaseAuthErrorMessage(err),
      });
    } finally {
      setIsCreatingAdmin(false);
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
      setTaskToast(
        "New task created, uploaded to Cloudinary, and saved to Firestore!"
      );
    }

    setTaskTitle("");
    setTaskDesc("");
    setTaskAttachmentUrl("");
    setTaskCloudinaryId("");
    setTimeout(() => {
      setTaskToast(null);
      setActiveTab("manage_tasks");
    }, 1200);
  };

  const handleAddAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adSponsor.trim()) return;
    createAd({
      title: adTitle,
      sponsor: adSponsor,
      description:
        adDesc ||
        "Exclusive partner offer for registered Wingpoll microtask earners.",
      ctaText: adCta || "Learn More",
      ctaUrl: "#partner",
      position: adPosition,
      format: adFormat,
      videoDuration: adFormat === "video" ? adVideoDuration || "0:45" : undefined,
      videoHeadline: adFormat === "video" ? adTitle : undefined,
      active: true,
      badgeText:
        adFormat === "video" ? "Sponsored Video Ad" : "Sponsored Banner",
    });
    setAdTitle("");
    setAdSponsor("");
    setAdDesc("");
  };

  // 1. Wait while Firebase Auth & Firestore User Role are loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-sm w-full text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            Verifying Admin Access...
          </h2>
          <p className="text-xs text-slate-500">
            Checking your authentication session and role in Firestore.
          </p>
        </div>
      </div>
    );
  }

  // 2. Check if user is logged in
  if (!firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900">
              Admin Sign-In Required
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              You must be logged in with an Administrator account (
              <code className="font-mono text-slate-700">role: &quot;admin&quot;</code>) to
              access the WingPoll Admin Portal.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] rounded-md transition-colors"
            >
              Log In as Admin
            </Link>
            <a
              href={WINGPOLL_DOMAIN}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Public Site
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Check if logged-in user has role === "admin"
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-slate-900">
              Access Denied — Admin Role Required
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
              . Only accounts with{" "}
              <code className="font-mono text-[#14532D] font-semibold">
                role: &quot;admin&quot;
              </code>{" "}
              can access <code className="font-mono">/admin</code>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {user.role === "agent-admin" && (
              <Link
                href="/agent-admin"
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#14532D] hover:bg-[#16A34A] rounded-md transition-colors"
              >
                Go to Agent Admin Console
              </Link>
            )}
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
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:sticky lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
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
              ADMIN CONSOLE
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
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-[#F0FDF4] text-[#14532D] font-semibold border border-emerald-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-[#16A34A]" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.id === "submissions" && pendingSubmissionsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                    {pendingSubmissionsCount}
                  </span>
                )}
                {item.id === "users" && pendingUsersCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                    {pendingUsersCount}
                  </span>
                )}
                {item.id === "withdrawals" && pendingWithdrawalsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-[#14532D] rounded">
                    {pendingWithdrawalsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-1.5">
          <a
            href={`${WINGPOLL_DOMAIN}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-[#14532D] bg-[#F0FDF4] border border-emerald-200 hover:bg-emerald-100"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Open Earner Dashboard</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                Wingpoll Administration —{" "}
                <span className="text-[#16A34A]">
                  {ADMIN_NAV.find((n) => n.id === activeTab)?.label}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingTaskId(null);
                setActiveTab("create_task");
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#16A34A] text-white rounded-md hover:bg-[#15803d] cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
            <a
              href={WINGPOLL_DOMAIN}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-slate-600 hover:text-[#16A34A]"
            >
              Public Site →
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* 1. ADMIN OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Platform Operations Overview
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time summary of registered earners, tasks, submissions,
                  and M-Pesa payouts.
                </p>
              </div>

              {/* 7 Required Admin Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Registered Users"
                  value={`${totalRegisteredUsers}`}
                  subtitle="Verified phone accounts"
                  icon={<Users className="w-5 h-5" />}
                />
                <StatsCard
                  title="Active Users"
                  value={`${activeUsersCount}`}
                  subtitle="Completing tasks this week"
                  icon={<UserCheck className="w-5 h-5" />}
                />
                <StatsCard
                  title="Total Tasks"
                  value={`${totalTasksCount}`}
                  subtitle={`${tasks.filter((t) => t.active).length} active in marketplace`}
                  icon={<Briefcase className="w-5 h-5" />}
                />
                <StatsCard
                  title="Total Rewards Issued"
                  value={`KSh ${totalRewardsIssued.toLocaleString()}`}
                  subtitle="Approved tasks + referrals"
                  icon={<Wallet className="w-5 h-5" />}
                  highlighted
                />
                <StatsCard
                  title="Pending Submissions"
                  value={`${pendingSubmissionsCount}`}
                  subtitle="Awaiting moderator review"
                  icon={<ClipboardCheck className="w-5 h-5" />}
                />
                <StatsCard
                  title="Approved Submissions"
                  value={`${approvedSubmissionsCount}`}
                  subtitle="Quality verified"
                  icon={<CheckCircle2 className="w-5 h-5" />}
                />
                <StatsCard
                  title="Pending Withdrawals"
                  value={`${pendingWithdrawalsCount}`}
                  subtitle="M-Pesa disbursement queue"
                  icon={<CreditCard className="w-5 h-5" />}
                />
              </div>

              {/* Quick Action Queues */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Submissions Queue */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Recent Task Submissions Queue
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("submissions")}
                      className="text-xs font-semibold text-[#16A34A] hover:underline cursor-pointer"
                    >
                      Review All ({submissions.length}) →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {submissions.slice(0, 4).map((sub) => (
                      <div
                        key={sub.id}
                        className="py-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {sub.taskTitle}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            by {sub.userName} • KSh {sub.reward}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sub.status} />
                          <Link
                            href={`/admin/submissions/${sub.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending M-Pesa Withdrawals Queue */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      M-Pesa Withdrawal Requests
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("withdrawals")}
                      className="text-xs font-semibold text-[#16A34A] hover:underline cursor-pointer"
                    >
                      Manage All ({withdrawals.length}) →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {withdrawals.slice(0, 4).map((wth) => (
                      <div
                        key={wth.id}
                        className="py-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {wth.userName} — KSh {wth.amount.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            M-Pesa: {wth.mpesaNumber} • {wth.reference}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={wth.status} />
                          {wth.status === "Processing" && (
                            <button
                              type="button"
                              onClick={() =>
                                processWithdrawal(
                                  wth.id,
                                  "Completed",
                                  "M-Pesa Receipt: SL99P40K2M (Approved by Admin)"
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    setEditingTaskId(null);
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
                      {tasks.map((task) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. CREATE / EDIT TASK */}
          {activeTab === "create_task" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-3xl space-y-5">
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
                    onClick={() => setEditingTaskId(null)}
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
                            "Watch the attached task video carefully.\nPause at key frames and extract all requested names, contacts, or figures from the video.\nEnter the extracted information into the submission form.\nSubmit your work for admin verification."
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
                      Submission Format
                    </label>
                    <select
                      value={taskFormat}
                      onChange={(e) =>
                        setTaskFormat(e.target.value as SubmissionFormat)
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    >
                      <option value="multiline_text">
                        Multiline Text Area
                      </option>
                      <option value="text_input">Single Text Input</option>
                      <option value="structured_table">
                        Structured Table Entry
                      </option>
                      <option value="multiple_fields">
                        Multiple Input Fields
                      </option>
                      <option value="file_upload">File Upload</option>
                      <option value="pdf_upload">PDF Upload</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Task Reward (KSh)
                    </label>
                    <input
                      type="number"
                      min={10}
                      value={taskReward}
                      onChange={(e) => setTaskReward(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    />
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
                      Estimated Completion Time
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
                      Task Deadline
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
                      Difficulty Level
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
                      Attachment Media Type
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
                      <option value="video">
                        Video File (.mp4, .webm, .mov)
                      </option>
                      <option value="image">
                        Image Scan (.png, .jpg, .webp)
                      </option>
                      <option value="pdf">PDF Document (.pdf)</option>
                      <option value="document">Word / Text Document</option>
                      <option value="spreadsheet">
                        Spreadsheet (.xlsx, .csv)
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Upload Task Attachment to Cloudinary (Video, Image, PDF,
                      or Document)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 bg-slate-50/70 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[#16A34A] shrink-0">
                            {taskAttachmentType === "video" ? (
                              <Film className="w-5 h-5" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {isUploadingTaskFile
                                ? "Uploading media to Cloudinary (dp5j28dmc)..."
                                : taskAttachmentUrl
                                ? `Uploaded: ${taskAttachmentName} (${taskAttachmentSize})`
                                : `Attachment Name: ${taskAttachmentName}`}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {taskAttachmentUrl
                                ? `Cloudinary URL: ${taskAttachmentUrl}`
                                : "Upload a video, image, or document file to Cloudinary CDN"}
                            </p>
                          </div>
                        </div>

                        <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded-md cursor-pointer shrink-0">
                          {isUploadingTaskFile ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload File to Cloudinary</span>
                            </>
                          )}
                          <input
                            type="file"
                            disabled={isUploadingTaskFile}
                            accept="video/*,image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                            onChange={handleTaskFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {taskUploadError && (
                        <p className="text-xs text-red-600 font-medium">
                          {taskUploadError}
                        </p>
                      )}

                      {/* Live Preview of Uploaded Cloudinary Video or Image */}
                      {taskAttachmentUrl && taskAttachmentType === "video" && (
                        <div className="rounded-md overflow-hidden border border-slate-800 bg-black">
                          <video
                            src={taskAttachmentUrl}
                            controls
                            className="w-full max-h-60 object-contain"
                          />
                        </div>
                      )}

                      {taskAttachmentUrl && taskAttachmentType === "image" && (
                        <div className="rounded-md overflow-hidden border border-slate-200 bg-white p-2">
                          <img
                            src={taskAttachmentUrl}
                            alt={taskAttachmentName}
                            className="max-h-56 object-contain mx-auto rounded"
                          />
                        </div>
                      )}

                      {taskAttachmentUrl && taskAttachmentType === "pdf" && (
                        <div className="rounded-md overflow-hidden border border-slate-200 bg-white">
                          <iframe
                            src={`${taskAttachmentUrl}#toolbar=1&navpanes=0`}
                            title={taskAttachmentName}
                            className="w-full h-72 bg-white"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Attachment Display File Name
                          </label>
                          <input
                            type="text"
                            value={taskAttachmentName}
                            onChange={(e) =>
                              setTaskAttachmentName(e.target.value)
                            }
                            placeholder="e.g. Product_Demo_Clip.mp4"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Direct Media URL (Auto-filled by Cloudinary)
                          </label>
                          <input
                            type="text"
                            value={taskAttachmentUrl}
                            onChange={(e) =>
                              setTaskAttachmentUrl(e.target.value)
                            }
                            placeholder="https://res.cloudinary.com/dp5j28dmc/..."
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Step-by-Step Instructions (One instruction per line)
                    </label>
                    <textarea
                      rows={4}
                      value={taskInstructionsText}
                      onChange={(e) => setTaskInstructionsText(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reference Keyframes / Sample Preview Notes (One line per
                      entry)
                    </label>
                    <textarea
                      rows={3}
                      value={taskSampleContentText}
                      onChange={(e) => setTaskSampleContentText(e.target.value)}
                      placeholder="[00:05] Speaker / Company details..."
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("manage_tasks")}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] rounded-md cursor-pointer"
                  >
                    {editingTaskId ? "Save Task Updates" : "Publish Task"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. SUBMISSION MANAGEMENT */}
          {activeTab === "submissions" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Task Submissions Moderation
                </h2>
                <p className="text-xs text-slate-500">
                  Click &ldquo;Review&rdquo; on any submission to open its
                  dedicated review page and Approve, Request Corrections, or
                  Reject.
                </p>
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
                      {submissions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 px-4 text-center text-slate-400"
                          >
                            No earner submissions yet.
                          </td>
                        </tr>
                      ) : (
                        submissions.map((sub) => (
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

          {/* 5. MANAGE USERS */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Manage Users &amp; Admin Accounts (Firestore Users Table)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage registered earners (
                    <code className="font-mono text-slate-700">role: user</code>
                    ), their randomly assigned agents, and admin roles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminFormStatus(null);
                    setActiveTab("create_user");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#16A34A] text-white rounded-md hover:bg-[#15803d] cursor-pointer self-start"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Admin User</span>
                </button>
              </div>

              {userApprovalToast && (
                <div className="p-3.5 rounded-lg bg-[#F0FDF4] border border-emerald-200 text-xs font-semibold text-[#14532D] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span>{userApprovalToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserApprovalToast(null)}
                    className="p-1 text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Assigned Agent</th>
                        <th className="py-3.5 px-4">M-Pesa Phone</th>
                        <th className="py-3.5 px-4">Available Balance</th>
                        <th className="py-3.5 px-4">Total Earned</th>
                        <th className="py-3.5 px-4">Tasks Done</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {allUsers.map((u, userIdx) => (
                        <tr key={u.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">
                              {u.name}
                            </p>
                            <span className="text-[11px] text-slate-400 block">
                              {u.email}
                            </span>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                                  u.emailVerified || u.role === "admin"
                                    ? "bg-[#F0FDF4] border-emerald-200 text-[#14532D]"
                                    : "bg-amber-50 border-amber-200 text-amber-800"
                                }`}
                              >
                                {u.emailVerified || u.role === "admin"
                                  ? "Email Verified ✓"
                                  : "Awaiting Email Verification"}
                              </span>
                              {u.referredByCode && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-[#14532D]">
                                  Referred by: {u.referredByCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-[#14532D] text-white"
                                  : u.role === "agent-admin"
                                  ? "bg-emerald-100 text-[#14532D] border border-emerald-300"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.role === "admin"
                                ? "Super Admin"
                                : u.role === "agent-admin"
                                ? "Agent Admin"
                                : "User"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.role === "user" || !u.role ? (
                              u.assignedAgentName ? (
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {u.assignedAgentName}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {u.assignedAgentRole === "admin"
                                      ? "Super Admin"
                                      : "Agent Admin"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  Unassigned
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {u.mpesaNumber || u.phone || "—"}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#16A34A]">
                            KSh {u.availableBalance.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            KSh {u.totalEarnings.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {u.completedTasks}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5 relative">
                              {(u.status === "Pending Approval" ||
                                u.status === "Rejected") && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await approveUserAccount(u.id);
                                    setOpenUserMenuId(null);
                                    setUserApprovalToast(
                                      u.referredByCode
                                        ? `Activated ${u.name}'s account & granted KSh 50 referral bonus to referrer (${u.referredByCode})!`
                                        : `Activated ${u.name}'s earner account! They can now access tasks.`
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded cursor-pointer shadow-2xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenUserMenuId((prev) =>
                                      prev === u.id ? null : u.id
                                    )
                                  }
                                  className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                                  aria-label={`More actions for ${u.name}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {openUserMenuId === u.id && (
                                  <div
                                    className={`absolute right-0 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-30 py-1 text-left ${
                                      userIdx >= allUsers.length - 2
                                        ? "bottom-full mb-1"
                                        : "top-full mt-1"
                                    }`}
                                  >
                                    {u.role !== "admin" &&
                                      (u.role === "agent-admin" ? (
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setOpenUserMenuId(null);
                                            await updateUserRole(u.id, "user");
                                            setUserApprovalToast(
                                              `${u.name} has been demoted from Agent Admin to User.`
                                            );
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 cursor-pointer"
                                        >
                                          Demote to User
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setOpenUserMenuId(null);
                                            await updateUserRole(
                                              u.id,
                                              "agent-admin"
                                            );
                                            setUserApprovalToast(
                                              `${u.name} has been promoted to Agent Admin and can now create tasks & manage submissions.`
                                            );
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs font-medium text-[#14532D] hover:bg-[#F0FDF4] cursor-pointer"
                                        >
                                          Promote to Agent Admin
                                        </button>
                                      ))}

                                    {(u.status === "Pending Approval" ||
                                      u.status === "Rejected") &&
                                      u.status !== "Rejected" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenUserMenuId(null);
                                            updateUserAccountStatus(
                                              u.id,
                                              "Rejected"
                                            );
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      )}

                                    {u.status !== "Pending Approval" &&
                                      u.status !== "Rejected" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenUserMenuId(null);
                                            toggleUserStatus(u.id);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                        >
                                          {u.status === "Active"
                                            ? "Suspend"
                                            : "Activate"}
                                        </button>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5B. CREATE ADMIN USER PAGE */}
          {activeTab === "create_user" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Create New Admin User
                  </h2>
                  <p className="text-xs text-slate-500">
                    Create a Firebase Authentication account and assign either{" "}
                    <code className="font-mono text-[#14532D]">agent-admin</code>{" "}
                    or{" "}
                    <code className="font-mono text-[#14532D]">admin</code>{" "}
                    (Super Admin) role in Firestore.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-md cursor-pointer self-start"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Manage Users</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-md bg-[#F0FDF4] border border-emerald-200 flex items-center justify-center text-[#16A34A]">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {createUserMode === "promote"
                          ? "Promote Existing User"
                          : "Create New Account"}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {createUserMode === "promote"
                          ? "Select an existing user from Firestore and promote them to Agent Admin or Super Admin."
                          : "New admin accounts are activated immediately without interrupting your current Super Admin session."}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 self-start">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateUserMode("promote");
                        setAdminFormStatus(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        createUserMode === "promote"
                          ? "bg-[#14532D] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Promote Existing User
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateUserMode("create");
                        setAdminFormStatus(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        createUserMode === "create"
                          ? "bg-[#14532D] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Create New Account
                    </button>
                  </div>
                </div>

                {adminFormStatus && (
                  <div
                    className={`p-3 rounded-md border text-xs font-medium ${
                      adminFormStatus.type === "success"
                        ? "bg-[#F0FDF4] border-emerald-200 text-[#14532D]"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}
                  >
                    {adminFormStatus.message}
                  </div>
                )}

                {createUserMode === "promote" ? (
                  <form onSubmit={handlePromoteUserSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Filter Users (by name or email)
                      </label>
                      <input
                        type="text"
                        value={promoteUserSearch}
                        onChange={(e) => setPromoteUserSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md mb-2"
                      />
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Select User to Promote *
                      </label>
                      <select
                        required
                        value={selectedPromoteUserId}
                        onChange={(e) => setSelectedPromoteUserId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      >
                        <option value="">-- Choose a user --</option>
                        {allUsers
                          .filter((u) => {
                            if (u.id === user.id) return false;
                            const q = promoteUserSearch.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              u.name.toLowerCase().includes(q) ||
                              u.email.toLowerCase().includes(q)
                            );
                          })
                          .map((u) => {
                            const currentRoleLabel =
                              u.role === "admin"
                                ? "Super Admin"
                                : u.role === "agent-admin"
                                ? "Agent Admin"
                                : "User";
                            return (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email}) — Current: {currentRoleLabel}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Promote To Role *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                            adminRole === "agent-admin"
                              ? "bg-[#F0FDF4] border-[#16A34A]"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                          }`}
                        >
                          <input
                            type="radio"
                            name="promoteRole"
                            value="agent-admin"
                            checked={adminRole === "agent-admin"}
                            onChange={() => setAdminRole("agent-admin")}
                            className="mt-0.5 accent-[#16A34A]"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Agent Admin
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Can create tasks and manage submissions for the
                              tasks they created only. No withdrawals or
                              transactions access.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                            adminRole === "admin"
                              ? "bg-[#F0FDF4] border-[#16A34A]"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                          }`}
                        >
                          <input
                            type="radio"
                            name="promoteRole"
                            value="admin"
                            checked={adminRole === "admin"}
                            onChange={() => setAdminRole("admin")}
                            className="mt-0.5 accent-[#16A34A]"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Super Admin
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Full access to users, roles, tasks, all
                              submissions, withdrawals, transactions, ads, and
                              settings.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isPromotingUser || !selectedPromoteUserId}
                        className="py-2.5 px-5 bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isPromotingUser ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Promoting User...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              Promote to{" "}
                              {adminRole === "agent-admin"
                                ? "Agent Admin"
                                : "Super Admin"}
                            </span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("users")}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        placeholder="e.g. Sarah Njeri"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="agent@wingpoll.co.ke"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="0712345678"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password (min 6 chars) *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Select User Role *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                          adminRole === "agent-admin"
                            ? "bg-[#F0FDF4] border-[#16A34A]"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name="adminRole"
                          value="agent-admin"
                          checked={adminRole === "agent-admin"}
                          onChange={() => setAdminRole("agent-admin")}
                          className="mt-0.5 accent-[#16A34A]"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Agent Admin
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Can create tasks and manage submissions for the
                            tasks they created only. No withdrawals or
                            transactions access.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                          adminRole === "admin"
                            ? "bg-[#F0FDF4] border-[#16A34A]"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name="adminRole"
                          value="admin"
                          checked={adminRole === "admin"}
                          onChange={() => setAdminRole("admin")}
                          className="mt-0.5 accent-[#16A34A]"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Super Admin
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Full access to users, roles, tasks, all submissions,
                            withdrawals, transactions, ads, and settings.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isCreatingAdmin}
                      className="py-2.5 px-5 bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isCreatingAdmin ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>
                            Create{" "}
                            {adminRole === "agent-admin"
                              ? "Agent Admin"
                              : "Super Admin"}
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("users")}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                )}
              </div>
            </div>
          )}

          {/* 6. REFERRAL MANAGEMENT */}
          {activeTab === "referrals" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Referral Program Management
                </h2>
                <p className="text-xs text-slate-500">
                  Monitor referral invitations, account approvals, and KSh 50
                  commission payouts.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Referred User</th>
                        <th className="py-3.5 px-4">Referred By</th>
                        <th className="py-3.5 px-4">Registration Date</th>
                        <th className="py-3.5 px-4">Tasks Completed</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">
                          Commission / Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {referrals.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 px-4 text-center text-slate-400"
                          >
                            No referrals recorded yet.
                          </td>
                        </tr>
                      ) : (
                        referrals.map((ref) => (
                          <tr key={ref.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {ref.referredName} ({ref.referredPhone})
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {ref.referrerName
                                ? `${ref.referrerName} (${ref.referrerCode || ""})`
                                : ref.referrerCode || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {ref.registrationDate}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              {ref.tasksCompleted} tasks
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={ref.status} />
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {ref.rewardEarned > 0 ? (
                                <span className="font-bold text-[#14532D]">
                                  KSh {ref.rewardEarned} Granted ✓
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    grantReferralBonusManual(ref.id)
                                  }
                                  className="px-3 py-1.5 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded cursor-pointer"
                                >
                                  Grant KSh 50 Bonus
                                </button>
                              )}
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

          {/* 7. WITHDRAWAL MANAGEMENT */}
          {activeTab === "withdrawals" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  M-Pesa Withdrawal Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Verify earner balances and M-Pesa phone numbers, then approve
                  or reject payout requests.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Reference</th>
                        <th className="py-3.5 px-4">User Details</th>
                        <th className="py-3.5 px-4">M-Pesa Number</th>
                        <th className="py-3.5 px-4">Requested Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">
                          Admin Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {withdrawals.map((wth) => (
                        <tr key={wth.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {wth.reference}
                            <span className="block text-[10px] font-sans text-slate-400">
                              {wth.requestedAt}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">
                              {wth.userName}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {wth.userEmail}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#14532D]">
                            {wth.mpesaNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            KSh {wth.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={wth.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  processWithdrawal(
                                    wth.id,
                                    "Completed",
                                    "M-Pesa Receipt: SL99P40K2M (Approved)"
                                  )
                                }
                                className="px-2.5 py-1.5 text-xs font-semibold bg-[#16A34A] hover:bg-[#15803d] text-white rounded cursor-pointer"
                              >
                                Approve (Complete)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  processWithdrawal(
                                    wth.id,
                                    "Failed",
                                    "Rejected / Reversed to user balance"
                                  )
                                }
                                className="px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Platform Transaction Ledger
                </h2>
                <p className="text-xs text-slate-500">
                  All task rewards, referral commissions, M-Pesa payouts, and
                  reversal entries.
                </p>
              </div>
              <TransactionTable transactions={transactions} />
            </div>
          )}

          {/* 9. ADVERTISEMENT MANAGEMENT */}
          {activeTab === "advertisements" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Advertisement Management
                </h2>
                <p className="text-xs text-slate-500">
                  Add sponsored placements, configure ad positions, preview
                  banners, and monitor impressions & clicks.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Create Ad Form */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                    Add New Advertisement
                  </h3>
                  <form onSubmit={handleAddAd} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Headline / Campaign Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={adTitle}
                        onChange={(e) => setAdTitle(e.target.value)}
                        placeholder="e.g. Safaricom 5G Router Promo"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sponsor Brand Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={adSponsor}
                        onChange={(e) => setAdSponsor(e.target.value)}
                        placeholder="e.g. Safaricom PLC"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ad Format
                        </label>
                        <select
                          value={adFormat}
                          onChange={(e) =>
                            setAdFormat(e.target.value as AdFormat)
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                        >
                          <option value="banner">Banner Ad</option>
                          <option value="video">Video Ad</option>
                        </select>
                      </div>

                      {adFormat === "video" ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Video Duration
                          </label>
                          <input
                            type="text"
                            value={adVideoDuration}
                            onChange={(e) => setAdVideoDuration(e.target.value)}
                            placeholder="e.g. 0:45"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Button CTA Label
                          </label>
                          <input
                            type="text"
                            value={adCta}
                            onChange={(e) => setAdCta(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Placement Position (Tasks, Banners & Video Slots)
                      </label>
                      <select
                        value={adPosition}
                        onChange={(e) =>
                          setAdPosition(e.target.value as AdPosition)
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      >
                        <option value="task_list_banner">
                          Tasks Marketplace Top Banner (task_list_banner)
                        </option>
                        <option value="task_list_inline">
                          Between Task Cards Inline Banner (task_list_inline)
                        </option>
                        <option value="task_list_video">
                          Tasks Marketplace Video Ad (task_list_video)
                        </option>
                        <option value="task_details_video">
                          Task Details Sidebar Video Ad (task_details_video)
                        </option>
                        <option value="task_details_sidebar">
                          Task Details Sidebar Banner (task_details_sidebar)
                        </option>
                        <option value="task_instructions_below">
                          Below Task Instructions Banner (task_instructions_below)
                        </option>
                        <option value="dashboard_banner">
                          User Dashboard Top Banner (dashboard_banner)
                        </option>
                        <option value="dashboard_section">
                          User Dashboard Content Section (dashboard_section)
                        </option>
                        <option value="homepage_top_leaderboard">
                          Landing Page Top Leaderboard (homepage_top_leaderboard)
                        </option>
                        <option value="homepage_promo">
                          Landing Page Mid Promo Banner (homepage_promo)
                        </option>
                        <option value="homepage_video_spotlight">
                          Landing Page Video Spotlight (homepage_video_spotlight)
                        </option>
                        <option value="homepage_native_left">
                          Landing Page Native Card Left (homepage_native_left)
                        </option>
                        <option value="homepage_native_right">
                          Landing Page Native Card Right (homepage_native_right)
                        </option>
                        <option value="homepage_bottom_banner">
                          Landing Page Bottom Banner (homepage_bottom_banner)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ad Copy / Description
                      </label>
                      <textarea
                        rows={2}
                        value={adDesc}
                        onChange={(e) => setAdDesc(e.target.value)}
                        placeholder="Short promotional copy..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold rounded-md cursor-pointer"
                    >
                      Add Advertisement
                    </button>
                  </form>
                </div>

                {/* Ad List & Stats */}
                <div className="lg:col-span-7 space-y-4">
                  {previewAdId && (
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Live Advertisement Preview</span>
                        <button
                          type="button"
                          onClick={() => setPreviewAdId(null)}
                          className="text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          Close Preview
                        </button>
                      </div>
                      <AdvertisementBanner
                        position="dashboard_banner"
                        customAd={ads.find((a) => a.id === previewAdId)}
                      />
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-4">Campaign / Sponsor</th>
                            <th className="py-3 px-4">Position</th>
                            <th className="py-3 px-4">Impressions / Clicks</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {ads.map((ad) => {
                            const ctr = (
                              (ad.clicks / Math.max(1, ad.impressions)) *
                              100
                            ).toFixed(1);
                            return (
                              <tr key={ad.id} className="hover:bg-slate-50/80">
                                <td className="py-3.5 px-4">
                                  <p className="font-semibold text-slate-900">
                                    {ad.title}
                                  </p>
                                  <span className="text-[11px] text-slate-400">
                                    {ad.sponsor}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        ad.format === "video"
                                          ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {ad.format === "video"
                                        ? "Video Ad"
                                        : "Banner Ad"}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-600">
                                      {ad.position}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                                  <strong>
                                    {ad.impressions.toLocaleString()}
                                  </strong>{" "}
                                  views • <strong>{ad.clicks}</strong> clicks (
                                  {ctr}%)
                                </td>
                                <td className="py-3.5 px-4">
                                  <StatusBadge
                                    status={ad.active ? "Active" : "Inactive"}
                                  />
                                </td>
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewAdId(ad.id)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                                      title="Preview Ad"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleAdActive(ad.id)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                                      title="Toggle Active"
                                    >
                                      <Power className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteAd(ad.id)}
                                      className="p-1.5 bg-slate-100 hover:text-red-600 text-slate-700 rounded cursor-pointer"
                                      title="Delete Ad"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Platform Performance Reports
                </h2>
                <p className="text-xs text-slate-500">
                  Analytics on task completion volume, approval rates, and
                  disbursed rewards.
                </p>
              </div>
              <EarningsChart />
            </div>
          )}

          {/* 11. SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Platform Rules & Payout Configuration
              </h2>
              {settingsSaved && (
                <div className="p-3 rounded-md bg-[#F0FDF4] border border-emerald-200 text-xs font-semibold text-[#14532D]">
                  Platform settings saved!
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum M-Pesa Withdrawal Threshold (KSh)
                  </label>
                  <input
                    type="number"
                    value={minWithdrawalSetting}
                    onChange={(e) =>
                      setMinWithdrawalSetting(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Referral Commission Per Qualified Friend (KSh)
                  </label>
                  <input
                    type="number"
                    value={referralBonusSetting}
                    onChange={(e) =>
                      setReferralBonusSetting(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 2500);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-[#16A34A] text-white rounded-md cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

