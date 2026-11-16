"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Advertisement,
  NotificationItem,
  ReferralRecord,
  Submission,
  SubmissionStatus,
  Task,
  Transaction,
  UserAccountStatus,
  UserProfile,
  UserRole,
  Withdrawal,
  WithdrawalStatus,
} from "@/lib/types";
import { INITIAL_USER } from "@/lib/mock-data";
import {
  adjustUserPendingEarningsInFirestore,
  auth,
  createAdminAccountInFirebase,
  deleteAdFromFirestore,
  deleteSubmissionFromFirestore,
  deleteTaskFromFirestore,
  fetchAllAdsFromFirestore,
  fetchAllNotificationsFromFirestore,
  fetchAllReferralsFromFirestore,
  fetchAllSubmissionsFromFirestore,
  fetchAllTasksFromFirestore,
  fetchAllTransactionsFromFirestore,
  fetchAllUsersFromFirestore,
  fetchAllWithdrawalsFromFirestore,
  FirebaseUser,
  grantReferralRewardInFirestore,
  grantTaskRewardToUserInFirestore,
  logoutFirebase,
  onAuthStateChanged,
  reloadFirebaseUser,
  saveAdToFirestore,
  saveNotificationToFirestore,
  saveReferralToFirestore,
  saveSubmissionToFirestore,
  saveTaskToFirestore,
  saveTransactionToFirestore,
  saveUserToFirestore,
  saveWithdrawalToFirestore,
  sendVerificationEmail,
  updateUserInFirestore,
  verifyEmailWithActionCode,
} from "@/lib/firebase";

interface AppContextType {
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  emailVerified: boolean;
  authLoading: boolean;
  logoutUser: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  resendEmailVerification: () => Promise<void>;
  verifyEmailWithCode: (codeOrUrl: string) => Promise<boolean>;
  refreshUserProfile: () => Promise<UserProfile | null>;
  allUsers: UserProfile[];
  tasks: Task[];
  submissions: Submission[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  referrals: ReferralRecord[];
  ads: Advertisement[];
  notifications: NotificationItem[];
  submitTask: (
    taskId: string,
    submittedData: Submission["submittedData"]
  ) => Submission;
  updateSubmission: (
    submissionId: string,
    submittedData: Submission["submittedData"]
  ) => void;
  cancelSubmission: (submissionId: string) => void;
  requestWithdrawal: (amount: number, mpesaNumber: string) => Withdrawal;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  // Admin methods
  createAdminAccount: (params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<UserProfile>;
  createTask: (taskData: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskActive: (taskId: string) => void;
  reviewSubmission: (
    submissionId: string,
    status: SubmissionStatus,
    feedback?: string
  ) => void;
  processWithdrawal: (
    withdrawalId: string,
    status: WithdrawalStatus,
    notes?: string
  ) => void;
  createAd: (
    adData: Omit<Advertisement, "id" | "impressions" | "clicks">
  ) => void;
  toggleAdActive: (adId: string) => void;
  deleteAd: (adId: string) => void;
  recordAdClick: (adId: string) => void;
  toggleUserStatus: (userId: string) => void;
  approveUserAccount: (userId: string) => Promise<void>;
  updateUserAccountStatus: (
    userId: string,
    status: UserAccountStatus
  ) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  grantReferralBonusManual: (referralId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function formatNowTimestamp(): string {
  const now = new Date();
  return now.toLocaleString("en-KE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load all collections from Firestore on startup
  useEffect(() => {
    fetchAllUsersFromFirestore().then(setAllUsers);
    fetchAllTasksFromFirestore().then(setTasks);
    fetchAllSubmissionsFromFirestore().then(setSubmissions);
    fetchAllWithdrawalsFromFirestore().then(setWithdrawals);
    fetchAllTransactionsFromFirestore().then(setTransactions);
    fetchAllReferralsFromFirestore().then(setReferrals);
    fetchAllAdsFromFirestore().then(setAds);
    fetchAllNotificationsFromFirestore().then(setNotifications);
  }, []);

  // Listen to Firebase Auth state changes (Email/Password & Google Sign-In)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setEmailVerified(fbUser ? fbUser.emailVerified : false);

      if (fbUser) {
        const savedProfile = await saveUserToFirestore(fbUser);
        setUser(savedProfile);
        setEmailVerified(Boolean(fbUser.emailVerified));

        const [latestUsers, latestReferrals] = await Promise.all([
          fetchAllUsersFromFirestore(),
          fetchAllReferralsFromFirestore(),
        ]);
        if (latestUsers.length > 0) {
          setAllUsers(latestUsers);
        } else {
          setAllUsers((prevUsers) => {
            const idx = prevUsers.findIndex(
              (u) => u.id === savedProfile.id || u.email === savedProfile.email
            );
            if (idx >= 0) {
              const copy = [...prevUsers];
              copy[idx] = { ...copy[idx], ...savedProfile };
              return copy;
            }
            return [savedProfile, ...prevUsers];
          });
        }
        setReferrals(latestReferrals);
      } else {
        setUser(INITIAL_USER);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logoutUser = async () => {
    try {
      await logoutFirebase();
    } catch {
      // Ignore if already signed out
    }
    setFirebaseUser(null);
    setEmailVerified(false);
    setUser(INITIAL_USER);
  };

  const refreshEmailVerification = async (): Promise<boolean> => {
    const verified = await reloadFirebaseUser();
    setEmailVerified(verified);
    if (auth.currentUser) {
      setFirebaseUser(auth.currentUser);
    }
    if (verified) {
      setUser((prev) => ({ ...prev, emailVerified: true }));
    }
    return verified;
  };

  const resendEmailVerification = async (): Promise<void> => {
    await sendVerificationEmail(auth.currentUser);
  };

  const verifyEmailWithCode = async (codeOrUrl: string): Promise<boolean> => {
    await verifyEmailWithActionCode(codeOrUrl);
    setEmailVerified(true);
    setUser((prev) => ({ ...prev, emailVerified: true }));
    if (auth.currentUser) {
      setFirebaseUser(auth.currentUser);
    }
    return true;
  };

  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    if (!auth.currentUser) return null;
    const savedProfile = await saveUserToFirestore(auth.currentUser);
    setUser(savedProfile);
    const [latestUsers, latestReferrals] = await Promise.all([
      fetchAllUsersFromFirestore(),
      fetchAllReferralsFromFirestore(),
    ]);
    if (latestUsers.length > 0) setAllUsers(latestUsers);
    setReferrals(latestReferrals);
    return savedProfile;
  };

  const submitTask = (
    taskId: string,
    submittedData: Submission["submittedData"]
  ): Submission => {
    const task = tasks.find((t) => t.id === taskId);
    const reward = task ? task.reward : 0;
    const newSub: Submission = {
      id: `sub-${Date.now().toString().slice(-5)}`,
      taskId,
      taskTitle: task ? task.title : "Task Submission",
      category: task ? task.category : "Data Entry",
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      submittedAt: formatNowTimestamp(),
      reward,
      status: "Pending Review",
      submittedData,
    };

    setSubmissions((prev) => [newSub, ...prev]);
    saveSubmissionToFirestore(newSub);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.availableSlots > 0) {
          const updatedTask = { ...t, availableSlots: t.availableSlots - 1 };
          saveTaskToFirestore(updatedTask);
          return updatedTask;
        }
        return t;
      })
    );

    const nextPending = user.pendingEarnings + reward;
    setUser((prev) => ({
      ...prev,
      pendingEarnings: nextPending,
    }));
    if (user.id) {
      updateUserInFirestore(user.id, { pendingEarnings: nextPending });
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: "Task Submitted for Review",
      message: `Your work for '${newSub.taskTitle}' (KSh ${reward}) is now Pending Review.`,
      time: formatNowTimestamp(),
      read: false,
      type: "submission",
    };
    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);

    return newSub;
  };

  const updateSubmission = (
    submissionId: string,
    submittedData: Submission["submittedData"]
  ) => {
    const target = submissions.find((s) => s.id === submissionId);
    if (!target) return;

    const wasNotPending =
      target.status === "Rejected" || target.status === "Revision Required";

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          const updated: Submission = {
            ...s,
            submittedAt: formatNowTimestamp(),
            status: "Pending Review",
            submittedData,
          };
          saveSubmissionToFirestore(updated);
          return updated;
        }
        return s;
      })
    );

    if (wasNotPending) {
      const nextPending = user.pendingEarnings + target.reward;
      setUser((prev) => ({
        ...prev,
        pendingEarnings: nextPending,
      }));
      if (user.id) {
        updateUserInFirestore(user.id, { pendingEarnings: nextPending });
      }
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: "Submission Updated",
      message: `Your updated submission for '${target.taskTitle}' has been saved and is Pending Review.`,
      time: formatNowTimestamp(),
      read: false,
      type: "submission",
    };
    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);
  };

  const cancelSubmission = (submissionId: string) => {
    const target = submissions.find((s) => s.id === submissionId);
    if (!target || target.status === "Approved") return;

    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    deleteSubmissionFromFirestore(submissionId);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === target.taskId) {
          const updatedTask = {
            ...t,
            availableSlots: Math.min(t.totalSlots, t.availableSlots + 1),
          };
          saveTaskToFirestore(updatedTask);
          return updatedTask;
        }
        return t;
      })
    );

    if (target.status === "Pending Review") {
      const nextPending = Math.max(0, user.pendingEarnings - target.reward);
      setUser((prev) => ({
        ...prev,
        pendingEarnings: nextPending,
      }));
      if (user.id) {
        updateUserInFirestore(user.id, { pendingEarnings: nextPending });
      }
    }
  };

  const requestWithdrawal = (
    amount: number,
    mpesaNumber: string
  ): Withdrawal => {
    const refCode = `MPESA-WTH-${Math.floor(10000 + Math.random() * 90000)}`;
    const newWithdrawal: Withdrawal = {
      id: `wth-${Date.now().toString().slice(-5)}`,
      reference: refCode,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount,
      mpesaNumber,
      requestedAt: formatNowTimestamp(),
      status: "Processing",
      notes: "Pending admin approval for M-Pesa payout",
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    saveWithdrawalToFirestore(newWithdrawal);

    const nextAvailable = Math.max(0, user.availableBalance - amount);
    setUser((prev) => ({
      ...prev,
      availableBalance: nextAvailable,
    }));
    if (user.id) {
      updateUserInFirestore(user.id, { availableBalance: nextAvailable });
    }

    const newTxn: Transaction = {
      id: `txn-${Date.now().toString().slice(-5)}`,
      userId: user.id,
      reference: refCode,
      date: new Date().toISOString().slice(0, 10),
      description: `M-Pesa Withdrawal Request to ${mpesaNumber} (Pending Admin Approval)`,
      amount: -amount,
      type: "Withdrawal",
      status: "Processing",
    };

    setTransactions((prev) => [newTxn, ...prev]);
    saveTransactionToFirestore(newTxn);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: "Withdrawal Request Sent for Admin Approval",
      message: `Your M-Pesa withdrawal request of KSh ${amount.toLocaleString()} to ${mpesaNumber} is awaiting admin approval.`,
      time: formatNowTimestamp(),
      read: false,
      type: "withdrawal",
    };
    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);

    return newWithdrawal;
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      if (updates.name) {
        const parts = updates.name.trim().split(" ");
        updated.avatarInitials = parts
          .map((p) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }
      if (updated.id) {
        updateUserInFirestore(updated.id, updated);
      }
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.read) {
          const updated = { ...n, read: true };
          saveNotificationToFirestore(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, read: true };
          saveNotificationToFirestore(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const createAdminAccount = async (params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<UserProfile> => {
    const newAdmin = await createAdminAccountInFirebase(params);
    setAllUsers((prev) => {
      const exists = prev.some(
        (u) => u.id === newAdmin.id || u.email === newAdmin.email
      );
      if (exists) {
        return prev.map((u) =>
          u.id === newAdmin.id || u.email === newAdmin.email ? newAdmin : u
        );
      }
      return [newAdmin, ...prev];
    });
    return newAdmin;
  };

  const createTask = (taskData: Omit<Task, "id" | "createdAt">): Task => {
    const newTask: Task = {
      ...taskData,
      id: `tsk-${Math.floor(200 + Math.random() * 799)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTasks((prev) => [newTask, ...prev]);
    saveTaskToFirestore(newTask);
    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, ...updates };
          saveTaskToFirestore(updated);
          return updated;
        }
        return t;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    deleteTaskFromFirestore(taskId);
  };

  const toggleTaskActive = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, active: !t.active };
          saveTaskToFirestore(updated);
          return updated;
        }
        return t;
      })
    );
  };

  const reviewSubmission = (
    submissionId: string,
    status: SubmissionStatus,
    feedback?: string
  ) => {
    const target = submissions.find((s) => s.id === submissionId);
    if (!target) return;

    const wasApproved = target.status === "Approved";
    const wasPending = target.status === "Pending Review";

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          const updated = {
            ...s,
            status,
            feedback: feedback ?? s.feedback,
          };
          saveSubmissionToFirestore(updated);
          return updated;
        }
        return s;
      })
    );

    const earner = allUsers.find((u) => u.id === target.userId);
    if (status === "Approved" && !wasApproved) {
      const localUpdatedFields = {
        availableBalance: (earner?.availableBalance ?? 0) + target.reward,
        totalEarnings: (earner?.totalEarnings ?? 0) + target.reward,
        taskEarnings: (earner?.taskEarnings ?? 0) + target.reward,
        pendingEarnings: wasPending
          ? Math.max(0, (earner?.pendingEarnings ?? 0) - target.reward)
          : earner?.pendingEarnings ?? 0,
        completedTasks: (earner?.completedTasks ?? 0) + 1,
      };

      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === target.userId ? { ...u, ...localUpdatedFields } : u
        )
      );

      if (target.userId === user.id) {
        setUser((prev) => ({
          ...prev,
          availableBalance: prev.availableBalance + target.reward,
          totalEarnings: prev.totalEarnings + target.reward,
          taskEarnings: prev.taskEarnings + target.reward,
          pendingEarnings: wasPending
            ? Math.max(0, prev.pendingEarnings - target.reward)
            : prev.pendingEarnings,
          completedTasks: prev.completedTasks + 1,
        }));
      }

      // Reliably read & credit earner's Firestore users/{userId} account
      grantTaskRewardToUserInFirestore(
        target.userId,
        target.reward,
        wasPending
      ).then((firestoreFields) => {
        if (firestoreFields) {
          setAllUsers((prev) =>
            prev.map((u) =>
              u.id === target.userId ? { ...u, ...firestoreFields } : u
            )
          );
          if (target.userId === user.id) {
            setUser((prev) => ({ ...prev, ...firestoreFields }));
          }
        }
      });

      // Also update referral progress & grant referral commission if user was referred
      grantReferralRewardInFirestore(target.userId, 50, true).then(
        (refResult) => {
          if (refResult) {
            const {
              referrerId,
              updatedReferrerFields,
              updatedReferralRecord,
              transaction,
              notification,
            } = refResult;

            if (Object.keys(updatedReferrerFields).length > 0) {
              setAllUsers((prev) =>
                prev.map((u) =>
                  u.id === referrerId
                    ? { ...u, ...updatedReferrerFields }
                    : u.id === target.userId
                    ? { ...u, referralRewardPaid: true }
                    : u
                )
              );
              if (user.id === referrerId) {
                setUser((prev) => ({ ...prev, ...updatedReferrerFields }));
              }
            }

            setReferrals((prev) => {
              const exists = prev.some(
                (r) => r.id === updatedReferralRecord.id
              );
              if (exists) {
                return prev.map((r) =>
                  r.id === updatedReferralRecord.id ? updatedReferralRecord : r
                );
              }
              return [updatedReferralRecord, ...prev];
            });

            if (transaction) {
              setTransactions((prev) => [transaction, ...prev]);
            }
            if (notification) {
              setNotifications((prev) => [notification, ...prev]);
            }
          }
        }
      );

      const newTxn: Transaction = {
        id: `txn-${Date.now().toString().slice(-5)}`,
        userId: target.userId,
        reference: `TXN-${Math.floor(10000 + Math.random() * 89999)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `Task Reward Granted: ${target.taskTitle}`,
        amount: target.reward,
        type: "Task Reward",
        status: "Completed",
      };
      setTransactions((prev) => [newTxn, ...prev]);
      saveTransactionToFirestore(newTxn);

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: target.userId,
        title: `Task Approved (+KSh ${target.reward} Credited)`,
        message: `Admin approved your submission for '${target.taskTitle}' and granted KSh ${target.reward.toLocaleString()} to your Available Balance!`,
        time: formatNowTimestamp(),
        read: false,
        type: "reward",
      };
      setNotifications((prev) => [newNotif, ...prev]);
      saveNotificationToFirestore(newNotif);
    } else if (
      (status === "Rejected" || status === "Revision Required") &&
      wasPending
    ) {
      const nextPending = Math.max(
        0,
        (earner?.pendingEarnings ?? 0) - target.reward
      );
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === target.userId ? { ...u, pendingEarnings: nextPending } : u
        )
      );
      if (target.userId === user.id) {
        setUser((prev) => ({
          ...prev,
          pendingEarnings: Math.max(0, prev.pendingEarnings - target.reward),
        }));
      }

      adjustUserPendingEarningsInFirestore(target.userId, -target.reward);

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: target.userId,
        title:
          status === "Rejected"
            ? `Submission Rejected: ${target.taskTitle}`
            : `Revision Requested: ${target.taskTitle}`,
        message:
          feedback ||
          (status === "Rejected"
            ? `Your submission for '${target.taskTitle}' was not approved.`
            : `Please review the moderator feedback and update your submission for '${target.taskTitle}'.`),
        time: formatNowTimestamp(),
        read: false,
        type: "submission",
      };
      setNotifications((prev) => [newNotif, ...prev]);
      saveNotificationToFirestore(newNotif);
    }
  };

  const processWithdrawal = (
    withdrawalId: string,
    status: WithdrawalStatus,
    notes?: string
  ) => {
    const target = withdrawals.find((w) => w.id === withdrawalId);
    if (!target) return;

    setWithdrawals((prev) =>
      prev.map((w) => {
        if (w.id === withdrawalId) {
          const updated: Withdrawal = {
            ...w,
            status,
            processedAt: formatNowTimestamp(),
            notes: notes ?? w.notes,
          };
          saveWithdrawalToFirestore(updated);
          return updated;
        }
        return w;
      })
    );

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.reference === target.reference) {
          const updated: Transaction = {
            ...t,
            status,
            description:
              status === "Completed"
                ? `M-Pesa Withdrawal Approved & Sent to ${target.mpesaNumber}`
                : status === "Failed"
                ? `M-Pesa Withdrawal Rejected (${target.mpesaNumber})`
                : t.description,
          };
          saveTransactionToFirestore(updated);
          return updated;
        }
        return t;
      })
    );

    if (status === "Completed" && target.status !== "Completed") {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: target.userId,
        title: "Withdrawal Approved by Admin",
        message: `Admin approved your KSh ${target.amount.toLocaleString()} withdrawal to ${target.mpesaNumber} (${target.reference}).`,
        time: formatNowTimestamp(),
        read: false,
        type: "withdrawal",
      };
      setNotifications((prev) => [newNotif, ...prev]);
      saveNotificationToFirestore(newNotif);
    }

    if (status === "Failed" && target.status !== "Failed") {
      const earner = allUsers.find((u) => u.id === target.userId);
      const refundedBalance =
        (earner?.availableBalance ?? user.availableBalance) + target.amount;

      updateUserInFirestore(target.userId, {
        availableBalance: refundedBalance,
      });
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === target.userId
            ? { ...u, availableBalance: refundedBalance }
            : u
        )
      );

      if (target.userId === user.id) {
        setUser((prev) => ({
          ...prev,
          availableBalance: refundedBalance,
        }));
      }

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: target.userId,
        title: "Withdrawal Request Declined",
        message: `Your withdrawal request of KSh ${target.amount.toLocaleString()} (${target.reference}) was declined by admin and refunded to your Available Balance.`,
        time: formatNowTimestamp(),
        read: false,
        type: "withdrawal",
      };
      setNotifications((prev) => [newNotif, ...prev]);
      saveNotificationToFirestore(newNotif);

      const revTxn: Transaction = {
        id: `txn-rev-${Date.now().toString().slice(-5)}`,
        userId: target.userId,
        reference: `REV-${target.reference}`,
        date: new Date().toISOString().slice(0, 10),
        description: `Reversal: Declined M-Pesa Withdrawal ${target.reference}`,
        amount: target.amount,
        type: "Withdrawal Reversal",
        status: "Completed",
      };
      setTransactions((prev) => [revTxn, ...prev]);
      saveTransactionToFirestore(revTxn);
    }
  };

  const createAd = (
    adData: Omit<Advertisement, "id" | "impressions" | "clicks">
  ) => {
    const newAd: Advertisement = {
      ...adData,
      id: `ad-${Date.now().toString().slice(-5)}`,
      impressions: 0,
      clicks: 0,
    };
    setAds((prev) => [newAd, ...prev]);
    saveAdToFirestore(newAd);
  };

  const toggleAdActive = (adId: string) => {
    setAds((prev) =>
      prev.map((a) => {
        if (a.id === adId) {
          const updated = { ...a, active: !a.active };
          saveAdToFirestore(updated);
          return updated;
        }
        return a;
      })
    );
  };

  const deleteAd = (adId: string) => {
    setAds((prev) => prev.filter((a) => a.id !== adId));
    deleteAdFromFirestore(adId);
  };

  const recordAdClick = (adId: string) => {
    setAds((prev) =>
      prev.map((a) => {
        if (a.id === adId) {
          const updated = {
            ...a,
            clicks: a.clicks + 1,
            impressions: a.impressions + 1,
          };
          saveAdToFirestore(updated);
          return updated;
        }
        return a;
      })
    );
  };

  const updateUserAccountStatus = async (
    userId: string,
    nextStatus: UserAccountStatus
  ) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );
    if (user.id === userId) {
      setUser((prev) => ({ ...prev, status: nextStatus }));
    }
    await updateUserInFirestore(userId, { status: nextStatus });

    const targetUser = allUsers.find((u) => u.id === userId);
    const notif: NotificationItem = {
      id: `notif-usr-${Date.now()}`,
      userId,
      title:
        nextStatus === "Active"
          ? "Account Approved by Admin!"
          : nextStatus === "Rejected"
          ? "Account Application Not Approved"
          : `Account Status: ${nextStatus}`,
      message:
        nextStatus === "Active"
          ? `Welcome ${
              targetUser?.name || ""
            }! Your WingPoll earner account has been approved by Admin. You can now access and complete tasks.`
          : `Your account status has been updated to ${nextStatus} by Admin.`,
      time: formatNowTimestamp(),
      read: false,
      type: "system",
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif);

    // When Admin approves a user account, automatically grant the referral reward (KSh 50) to their referrer!
    if (nextStatus === "Active") {
      const refResult = await grantReferralRewardInFirestore(userId, 50, false);
      if (refResult) {
        const {
          referrerId,
          updatedReferrerFields,
          updatedReferralRecord,
          transaction,
          notification,
        } = refResult;

        if (Object.keys(updatedReferrerFields).length > 0) {
          setAllUsers((prev) =>
            prev.map((u) =>
              u.id === referrerId
                ? { ...u, ...updatedReferrerFields }
                : u.id === userId
                ? { ...u, referralRewardPaid: true }
                : u
            )
          );
          if (user.id === referrerId) {
            setUser((prev) => ({ ...prev, ...updatedReferrerFields }));
          }
        }

        setReferrals((prev) => {
          const exists = prev.some((r) => r.id === updatedReferralRecord.id);
          if (exists) {
            return prev.map((r) =>
              r.id === updatedReferralRecord.id ? updatedReferralRecord : r
            );
          }
          return [updatedReferralRecord, ...prev];
        });

        if (transaction) {
          setTransactions((prev) => [transaction, ...prev]);
        }
        if (notification) {
          setNotifications((prev) => [notification, ...prev]);
        }
      }
    }
  };

  const approveUserAccount = async (userId: string) => {
    await updateUserAccountStatus(userId, "Active");
  };

  const toggleUserStatus = (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    const nextStatus: UserAccountStatus =
      targetUser?.status === "Active" ? "Suspended" : "Active";
    updateUserAccountStatus(userId, nextStatus);
  };

  const updateUserRole = async (userId: string, nextRole: UserRole) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    const nextStatus: UserAccountStatus =
      nextRole !== "user" ? "Active" : targetUser?.status || "Active";

    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: nextRole, status: nextStatus } : u
      )
    );
    if (user.id === userId) {
      setUser((prev) => ({ ...prev, role: nextRole, status: nextStatus }));
    }

    await updateUserInFirestore(userId, { role: nextRole, status: nextStatus });

    const roleLabel =
      nextRole === "admin"
        ? "Super Admin"
        : nextRole === "agent-admin"
        ? "Agent Admin"
        : "User";

    const notif: NotificationItem = {
      id: `notif-role-${Date.now()}`,
      userId,
      title: `Account Role Updated: ${roleLabel}`,
      message:
        nextRole === "agent-admin"
          ? `Congratulations ${targetUser?.name || ""}! You have been promoted to Agent Admin. You can now create tasks and manage task submissions.`
          : `Your WingPoll account role has been updated to ${roleLabel} by Super Admin.`,
      time: formatNowTimestamp(),
      read: false,
      type: "system",
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif);
  };

  const grantReferralBonusManual = async (referralId: string) => {
    const refRecord = referrals.find((r) => r.id === referralId);
    if (!refRecord || refRecord.rewardEarned > 0) return;

    if (refRecord.referredUserId) {
      const refResult = await grantReferralRewardInFirestore(
        refRecord.referredUserId,
        50,
        false
      );
      if (refResult) {
        const {
          referrerId,
          updatedReferrerFields,
          updatedReferralRecord,
          transaction,
          notification,
        } = refResult;

        if (Object.keys(updatedReferrerFields).length > 0) {
          setAllUsers((prev) =>
            prev.map((u) =>
              u.id === referrerId ? { ...u, ...updatedReferrerFields } : u
            )
          );
          if (user.id === referrerId) {
            setUser((prev) => ({ ...prev, ...updatedReferrerFields }));
          }
        }
        setReferrals((prev) =>
          prev.map((r) => (r.id === referralId ? updatedReferralRecord : r))
        );
        if (transaction) setTransactions((prev) => [transaction, ...prev]);
        if (notification) setNotifications((prev) => [notification, ...prev]);
        return;
      }
    }

    // Fallback if referral record did not have referredUserId
    const bonusAmount = 50;
    const updatedRecord: ReferralRecord = {
      ...refRecord,
      status: "Active",
      rewardEarned: bonusAmount,
    };
    setReferrals((prev) =>
      prev.map((r) => (r.id === referralId ? updatedRecord : r))
    );
    saveReferralToFirestore(updatedRecord);

    if (refRecord.referrerId) {
      const referrer = allUsers.find((u) => u.id === refRecord.referrerId);
      const updatedFields = {
        availableBalance: (referrer?.availableBalance ?? 0) + bonusAmount,
        totalEarnings: (referrer?.totalEarnings ?? 0) + bonusAmount,
        referralEarnings: (referrer?.referralEarnings ?? 0) + bonusAmount,
      };
      await updateUserInFirestore(refRecord.referrerId, updatedFields);
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === refRecord.referrerId ? { ...u, ...updatedFields } : u
        )
      );
      if (user.id === refRecord.referrerId) {
        setUser((prev) => ({ ...prev, ...updatedFields }));
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        firebaseUser,
        emailVerified,
        authLoading,
        logoutUser,
        refreshEmailVerification,
        resendEmailVerification,
        verifyEmailWithCode,
        refreshUserProfile,
        allUsers,
        tasks,
        submissions,
        withdrawals,
        transactions,
        referrals,
        ads,
        notifications,
        submitTask,
        updateSubmission,
        cancelSubmission,
        requestWithdrawal,
        updateUserProfile,
        markAllNotificationsRead,
        markNotificationRead,
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
        recordAdClick,
        toggleUserStatus,
        approveUserAccount,
        updateUserAccountStatus,
        updateUserRole,
        grantReferralBonusManual,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
