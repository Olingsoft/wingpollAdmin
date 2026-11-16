export type TaskCategory =
  | "Video Extraction"
  | "Image to Text"
  | "Data Entry"
  | "Email Extraction"
  | "Document Formatting"
  | "PDF Creation"
  | "Text Transcription"
  | "Information Sorting"
  | "Simple Research";

export type TaskDifficulty = "Easy" | "Medium" | "Hard";

export type SubmissionFormat =
  | "text_input"
  | "multiline_text"
  | "structured_table"
  | "file_upload"
  | "pdf_upload"
  | "multiple_fields";

export interface TaskAttachment {
  name: string;
  size: string;
  type: "image" | "video" | "pdf" | "document" | "spreadsheet";
  previewUrl?: string;
  cloudinaryPublicId?: string;
  sampleContent?: string[];
}

export interface TaskFieldConfig {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface Task {
  id: string;
  title: string;
  shortDescription: string;
  category: TaskCategory;
  estimatedTime: string;
  reward: number; // in KSh
  difficulty: TaskDifficulty;
  availableSlots: number;
  totalSlots: number;
  createdAt: string;
  deadline: string;
  active: boolean;
  instructions: string[];
  submissionFormat: SubmissionFormat;
  attachment: TaskAttachment;
  fields?: TaskFieldConfig[];
  tableColumns?: string[];
  createdBy?: string;
  createdByName?: string;
  createdByRole?: UserRole;
}

export type SubmissionStatus =
  | "Pending Review"
  | "Approved"
  | "Rejected"
  | "Revision Required";

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  userId: string;
  userName: string;
  userEmail: string;
  submittedAt: string;
  reward: number;
  status: SubmissionStatus;
  feedback?: string;
  submittedData: {
    format: SubmissionFormat;
    textAnswer?: string;
    tableRows?: Record<string, string>[];
    fieldValues?: Record<string, string>;
    fileName?: string;
    fileSize?: string;
    fileUrl?: string;
    notes?: string;
  };
}

export type WithdrawalStatus = "Processing" | "On Hold" | "Completed" | "Failed";

export interface Withdrawal {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  mpesaNumber: string;
  requestedAt: string;
  processedAt?: string;
  status: WithdrawalStatus;
  notes?: string;
}

export type TransactionType =
  | "Task Reward"
  | "Referral Reward"
  | "Daily Video Ad"
  | "Withdrawal"
  | "Withdrawal Reversal";

export type TransactionStatus = "Completed" | "Processing" | "Failed" | "Pending";

export interface Transaction {
  id: string;
  userId?: string;
  reference: string;
  date: string;
  description: string;
  amount: number; // positive or negative display handled by type
  type: TransactionType;
  status: TransactionStatus;
}

export interface ReferralRecord {
  id: string;
  referrerId?: string;
  referrerName?: string;
  referrerCode?: string;
  referredUserId?: string;
  referredEmail?: string;
  referredName: string;
  referredPhone: string;
  registrationDate: string;
  tasksCompleted: number;
  status: "Active" | "Pending Approval" | "Pending First Task";
  rewardEarned: number;
}

export type AdPosition =
  | "homepage_top_leaderboard"
  | "homepage_promo"
  | "homepage_video_spotlight"
  | "homepage_native_left"
  | "homepage_native_right"
  | "homepage_bottom_banner"
  | "dashboard_banner"
  | "task_list_banner"
  | "task_list_inline"
  | "task_list_video"
  | "task_details_sidebar"
  | "task_details_video"
  | "task_instructions_below"
  | "dashboard_section";

export type AdFormat = "banner" | "video";

export interface Advertisement {
  id: string;
  title: string;
  sponsor: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  position: AdPosition;
  format?: AdFormat;
  videoDuration?: string;
  videoHeadline?: string;
  active: boolean;
  impressions: number;
  clicks: number;
  badgeText?: string;
}

export type UserRole = "user" | "agent-admin" | "admin";

export type UserAccountStatus =
  | "Pending Approval"
  | "Active"
  | "Suspended"
  | "Rejected";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  mpesaNumber: string;
  role?: UserRole;
  avatarInitials: string;
  photoURL?: string;
  emailVerified?: boolean;
  authProvider?: "email" | "google" | "demo";
  availableBalance: number;
  totalEarnings: number;
  pendingEarnings: number;
  completedTasks: number;
  totalReferrals: number;
  referralEarnings: number;
  taskEarnings: number;
  referralCode: string;
  referralLink: string;
  referredByCode?: string;
  referredByUserId?: string;
  referralRewardPaid?: boolean;
  joinedDate: string;
  status: UserAccountStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentEmail?: string;
  assignedAgentRole?: UserRole;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "reward" | "submission" | "withdrawal" | "referral" | "system";
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  seoTitle?: string;
  metaDescription?: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  published: boolean;
  content: string[];
}

