import {
  Advertisement,
  NotificationItem,
  ReferralRecord,
  Submission,
  Task,
  Transaction,
  UserProfile,
  Withdrawal,
} from "./types";

export const INITIAL_USER: UserProfile = {
  id: "",
  name: "User",
  email: "",
  phone: "",
  mpesaNumber: "",
  role: "user",
  avatarInitials: "WP",
  availableBalance: 0,
  totalEarnings: 0,
  pendingEarnings: 0,
  completedTasks: 0,
  totalReferrals: 0,
  referralEarnings: 0,
  taskEarnings: 0,
  referralCode: "",
  referralLink: "",
  joinedDate: new Date().toISOString().slice(0, 10),
  status: "Active",
};

export const MOCK_ALL_USERS: UserProfile[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_SUBMISSIONS: Submission[] = [];

export const INITIAL_WITHDRAWALS: Withdrawal[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_REFERRALS: ReferralRecord[] = [];

export const INITIAL_ADS: Advertisement[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const EARNINGS_CHART_DATA: {
  name: string;
  taskEarnings: number;
  referralEarnings: number;
}[] = [];
