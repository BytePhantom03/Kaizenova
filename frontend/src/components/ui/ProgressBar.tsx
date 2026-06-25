"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ProgressVariant = "primary" | "success" | "warning" | "danger";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  /** Progress value from 0 to 100 */
  value: number;
  /** Color variant */
  variant?: ProgressVariant;
  /** Track height */
  size?: ProgressSize;
  /** Whether to show the percentage label */
  showLabel?: boolean;
  /** Custom label text (shown instead of percentage) */
  label?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Additional class names */
  className?: string;
}

/* ── gradient fills per variant ── */
const gradients: Record<ProgressVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary/80 via-primary to-[#7C3AED]",
  success:
    "bg-gradient-to-r from-emerald-500/80 via-success to-emerald-400",
  warning:
    "bg-gradient-to-r from-amber-600/80 via-warning to-yellow-400",
  danger:
    "bg-gradient-to-r from-red-600/80 via-danger to-rose-400",
};

/* ── glow shadows per variant ── */
const glows: Record<ProgressVariant, string> = {
  primary: "shadow-glow-primary",
  success: "shadow-glow-success",
  warning: "shadow-[0_0_20px_rgba(245,158,11,0.15),0_0_60px_rgba(245,158,11,0.05)]",
  danger: "shadow-glow-accent",
};

/* ── label text color per variant ── */
const labelColors: Record<ProgressVariant, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/* ── track sizes ── */
const trackSizes: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  variant = "primary",
  size = "md",
  showLabel = false,
  label,
  duration = 0.8,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {/* Label row */}
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && (
            <span className="font-medium text-muted-foreground">{label}</span>
          )}
          <span className={cn("font-semibold tabular-nums", labelColors[variant])}>
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          trackSizes[size]
        )}
      >
        {/* Filled portion */}
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            gradients[variant],
            glows[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{
            duration,
            ease: [0.16, 1, 0.3, 1], // ease-out-expo
          }}
        >
          {/* Shimmer / shine sweep */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.4s ease-in-out infinite",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

ProgressBar.displayName = "ProgressBar";
