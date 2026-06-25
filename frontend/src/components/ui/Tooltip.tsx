"use client";

import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  /** Tooltip text content */
  content: string;
  /** Which side the tooltip appears on */
  side?: TooltipSide;
  /** Delay before showing (ms) */
  delayMs?: number;
  /** Additional class names on the wrapper */
  className?: string;
  children: React.ReactNode;
}

/* ── position & arrow classes per side ── */
const positions: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowPositions: Record<TooltipSide, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-[color:var(--color-surface-overlay)]",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-b-[color:var(--color-surface-overlay)]",
  left: "left-full top-1/2 -translate-y-1/2 border-l-[color:var(--color-surface-overlay)]",
  right:
    "right-full top-1/2 -translate-y-1/2 border-r-[color:var(--color-surface-overlay)]",
};

const arrowBorders: Record<TooltipSide, string> = {
  top: "border-l-transparent border-r-transparent border-b-transparent border-t-4 border-l-4 border-r-4 border-b-0",
  bottom:
    "border-l-transparent border-r-transparent border-t-transparent border-b-4 border-l-4 border-r-4 border-t-0",
  left: "border-t-transparent border-b-transparent border-r-transparent border-l-4 border-t-4 border-b-4 border-r-0",
  right:
    "border-t-transparent border-b-transparent border-l-transparent border-r-4 border-t-4 border-b-4 border-l-0",
};

/* ── origin per side for scale animation ── */
const originMap: Record<TooltipSide, string> = {
  top: "bottom center",
  bottom: "top center",
  left: "right center",
  right: "left center",
};

export function Tooltip({
  content,
  side = "top",
  delayMs = 150,
  className,
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(true), delayMs);
  }, [delayMs]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  }, []);

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: originMap[side] }}
            className={cn(
              "pointer-events-none absolute z-50 max-w-xs whitespace-nowrap",
              positions[side]
            )}
          >
            {/* Tooltip body */}
            <div
              className={cn(
                "glass-strong rounded-lg border border-border/60 px-3 py-1.5",
                "text-xs font-medium text-foreground shadow-lg"
              )}
            >
              {content}
            </div>

            {/* Arrow */}
            <span
              className={cn(
                "absolute block h-0 w-0 border-solid",
                arrowPositions[side],
                arrowBorders[side]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

Tooltip.displayName = "Tooltip";
