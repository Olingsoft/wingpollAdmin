"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Megaphone,
  Pause,
  Play,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AdPosition, Advertisement } from "@/lib/types";
import { useApp } from "@/context/AppContext";

interface AdvertisementBannerProps {
  position: AdPosition;
  customAd?: Advertisement;
  compact?: boolean;
  showPlaceholder?: boolean;
  placeholderTitle?: string;
  placeholderSubtitle?: string;
  placeholderFormat?: string;
}

export function AdvertisementBanner({
  position,
  customAd,
  compact = false,
  showPlaceholder = false,
  placeholderTitle = "Sponsored Ad Space Available",
  placeholderSubtitle = "Promote your brand, product, or fintech service to active Kenyan earners.",
  placeholderFormat = "Display Banner",
}: AdvertisementBannerProps) {
  const { ads, recordAdClick } = useApp();
  const [clickedNotice, setClickedNotice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(25);

  const ad =
    customAd || ads.find((item) => item.position === position && item.active);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 5;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!ad) {
    if (!showPlaceholder) return null;

    const isVideoSlot = position === "homepage_video_spotlight";

    if (isVideoSlot) {
      return (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#F0FDF4] text-[#14532D] border border-emerald-200 rounded">
              <Video className="w-3 h-3 text-[#16A34A]" />
              Sponsored Video Ad Space
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {placeholderFormat}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 bg-slate-900/95 text-white p-6 flex flex-col items-center justify-center text-center min-h-[160px] space-y-2">
              <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-[#4ade80] ml-0.5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Video Ad Placement Ready
              </p>
              <span className="text-[10px] font-mono text-slate-400">
                16:9 Sponsored Clip
              </span>
            </div>
            <div className="md:col-span-7 p-5 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">
                  {placeholderTitle}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {placeholderSubtitle}
                </p>
              </div>
              <div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] rounded-md transition-colors"
                >
                  <span>Book Video Ad Space</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (compact) {
      return (
        <div className="bg-slate-50/90 border border-dashed border-slate-300 rounded-lg p-5 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-200/80 text-slate-600 rounded">
                <Megaphone className="w-3 h-3" />
                Ad Space
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {placeholderFormat}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              {placeholderTitle}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {placeholderSubtitle}
            </p>
          </div>
          <div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#14532D]"
            >
              <span>Advertise Here</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-lg p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 rounded">
                <Megaphone className="w-3 h-3 text-slate-500" />
                Ad Space
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {placeholderFormat}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              {placeholderTitle}
            </h4>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {placeholderSubtitle}
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#14532D] bg-[#F0FDF4] hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Advertise Here</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const handleCtaClick = () => {
    recordAdClick(ad.id);
    setClickedNotice(true);
    if (ad.ctaUrl && ad.ctaUrl.startsWith("http") && typeof window !== "undefined") {
      window.open(ad.ctaUrl, "_blank", "noopener,noreferrer");
    }
    setTimeout(() => setClickedNotice(false), 2500);
  };

  const isVideoAd =
    ad.format === "video" ||
    position === "task_list_video" ||
    position === "task_details_video" ||
    position === "homepage_video_spotlight";

  // VIDEO AD RENDERER
  if (isVideoAd) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Top Sponsored Video Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#F0FDF4] text-[#14532D] border border-emerald-200 rounded">
            <Video className="w-3 h-3 text-[#16A34A]" />
            {ad.badgeText || "Sponsored Video Ad"}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {ad.sponsor}
          </span>
        </div>

        <div
          className={`grid grid-cols-1 ${
            compact || position === "task_details_video"
              ? "gap-0"
              : "md:grid-cols-12 gap-0"
          }`}
        >
          {/* Interactive Video Player Viewport */}
          <div
            className={`${
              compact || position === "task_details_video"
                ? ""
                : "md:col-span-5"
            } relative bg-slate-900 text-white p-5 flex flex-col justify-between min-h-[170px] select-none`}
          >
            {/* Subtle visual backdrop */}
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[10px]">
                {isPlaying ? "PLAYING AD" : "VIDEO PREVIEW"}
              </span>
              <span className="font-mono text-xs bg-black/50 px-2 py-0.5 rounded">
                {ad.videoDuration || "0:45"}
              </span>
            </div>

            {/* Center Play Button & Headline */}
            <div className="my-3 flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying((prev) => !prev);
                  recordAdClick(ad.id);
                }}
                className="w-11 h-11 rounded-full bg-[#16A34A] hover:bg-[#15803d] text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                aria-label={isPlaying ? "Pause Video Ad" : "Play Video Ad"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div>
                <p className="text-xs font-bold text-white leading-snug">
                  {ad.videoHeadline || ad.title}
                </p>
                <p className="text-[11px] text-emerald-300 mt-0.5">
                  {isPlaying
                    ? "Playing sponsored video..."
                    : "Click play to watch sponsored clip"}
                </p>
              </div>
            </div>

            {/* Video Controls & Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4ade80] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Sponsored • {ad.sponsor}</span>
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#4ade80]" />
                      <span>Audio On</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Video Ad Details & CTA */}
          <div
            className={`${
              compact || position === "task_details_video"
                ? ""
                : "md:col-span-7"
            } p-4 sm:p-5 flex flex-col justify-between gap-3`}
          >
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">{ad.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {ad.description}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCtaClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] rounded-md transition-colors cursor-pointer"
              >
                <span>{ad.ctaText}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              {clickedNotice && (
                <span className="text-[11px] text-[#16A34A] font-medium">
                  Sponsor offer opened
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // COMPACT / SIDEBAR BANNER AD
  if (compact || position === "task_details_sidebar") {
    return (
      <div className="bg-slate-50/90 border border-dashed border-slate-300 rounded-lg p-4 relative">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-200/80 text-slate-600 rounded">
            <Megaphone className="w-3 h-3" />
            {ad.badgeText || "Sponsored Banner"}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {ad.sponsor}
          </span>
        </div>
        <h4 className="text-xs font-semibold text-slate-800 mb-1">
          {ad.title}
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          {ad.description}
        </p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleCtaClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:text-[#14532D] transition-colors cursor-pointer"
          >
            {ad.ctaText}
            <ExternalLink className="w-3 h-3" />
          </button>
          {clickedNotice && (
            <span className="text-[11px] text-emerald-700 font-medium">
              Partner link recorded
            </span>
          )}
        </div>
      </div>
    );
  }

  // FULL HORIZONTAL BANNER AD
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 rounded">
              <Megaphone className="w-3 h-3 text-slate-500" />
              {ad.badgeText || "Sponsored Banner"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              by {ad.sponsor}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-900">{ad.title}</h4>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {ad.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {clickedNotice && (
            <span className="text-xs text-[#16A34A] font-medium">
              Visited partner offer
            </span>
          )}
          <button
            type="button"
            onClick={handleCtaClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#14532D] bg-[#F0FDF4] hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
          >
            {ad.ctaText}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
