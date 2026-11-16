import React from "react";

interface WingPollLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function WingPollLoader({
  message,
  fullScreen = true,
}: WingPollLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || "Loading WingPoll"}
      className={
        fullScreen
          ? "min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6"
          : "min-h-[320px] w-full flex flex-col items-center justify-center p-6"
      }
    >
      <div className="flex flex-col items-center gap-5">
        <img
          src="/logo.png"
          alt="WingPoll"
          width={200}
          height={54}
          className="h-12 w-auto object-contain select-none"
        />

        <div className="flex items-center justify-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full bg-[#16A34A]/60 animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "900ms" }}
          />
          <span
            className="w-3 h-3 rounded-full bg-[#16A34A]/75 animate-bounce"
            style={{ animationDelay: "180ms", animationDuration: "900ms" }}
          />
          <span
            className="w-3 h-3 rounded-full bg-[#16A34A] animate-bounce"
            style={{ animationDelay: "360ms", animationDuration: "900ms" }}
          />
        </div>

        {message && (
          <p className="text-xs font-medium text-slate-500 text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

