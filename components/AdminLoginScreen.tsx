"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  getFirebaseAuthErrorMessage,
  loginWithEmail,
  saveUserToFirestore,
  signInWithGooglePopup,
  WINGPOLL_DOMAIN,
} from "@/lib/firebase";
import { useApp } from "@/context/AppContext";
import { WingPollLoader } from "@/components/WingPollLoader";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function AdminLoginScreen() {
  const router = useRouter();
  const { user, firebaseUser, authLoading, updateUserProfile, logoutUser } =
    useApp();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (authLoading || !firebaseUser) return;
    if (user.role === "admin") {
      router.replace("/admin");
    } else if (user.role === "agent-admin") {
      router.replace("/agent-admin");
    }
  }, [authLoading, firebaseUser, user.role, router]);

  const routeByRole = (role?: string) => {
    if (role === "admin") {
      router.push("/admin");
      return true;
    }
    if (role === "agent-admin") {
      router.push("/agent-admin");
      return true;
    }
    return false;
  };

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    setIsEmailLoading(true);
    try {
      const fbUser = await loginWithEmail(data.email, data.password);
      const savedProfile = await saveUserToFirestore(fbUser);
      updateUserProfile(savedProfile);
      if (!routeByRole(savedProfile.role)) {
        setAuthError(
          "This account does not have Administrator or Agent Admin permissions."
        );
      }
    } catch (error) {
      setAuthError(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      const fbUser = await signInWithGooglePopup();
      const savedProfile = await saveUserToFirestore(fbUser, {
        authProvider: "google",
      });
      updateUserProfile(savedProfile);
      if (!routeByRole(savedProfile.role)) {
        setAuthError(
          "This Google account does not have Administrator or Agent Admin permissions."
        );
      }
    } catch (error) {
      setAuthError(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (authLoading) {
    return <WingPollLoader message="Checking Admin Session..." />;
  }

  if (
    firebaseUser &&
    (user.role === "admin" || user.role === "agent-admin")
  ) {
    return <WingPollLoader message="Redirecting to Console..." />;
  }

  if (
    firebaseUser &&
    user.role !== "admin" &&
    user.role !== "agent-admin"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-slate-900">
              Admin Access Restricted
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Signed in as{" "}
              <strong className="text-slate-800">
                {user.email || firebaseUser.email}
              </strong>{" "}
              with role{" "}
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                {user.role || "user"}
              </span>
              . Only Administrator and Agent Admin accounts can access this
              portal.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await logoutUser();
                setAuthError(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] rounded-md transition-colors cursor-pointer"
            >
              Switch Account
            </button>
            <a
              href={WINGPOLL_DOMAIN}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <span>Go to Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/hero-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-slate-950/75" />

      <div className="relative z-10 max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-lg">
        <div className="text-center mb-6">
          <img
            src="/icon.png"
            alt="WingPoll Admin"
            className="w-12 h-12 rounded-xl mx-auto mb-3 object-contain"
          />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] border border-emerald-200 text-[#14532D] text-[11px] font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>WingPoll Admin Portal</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Administrator Sign In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your Admin or Agent Admin credentials
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                {...register("email")}
                placeholder="admin@wingpoll.co.ke"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isEmailLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isEmailLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="px-2 bg-white text-slate-400 font-medium">
              OR
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isEmailLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <a
            href={WINGPOLL_DOMAIN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#16A34A]"
          >
            <span>Open Main WingPoll Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

