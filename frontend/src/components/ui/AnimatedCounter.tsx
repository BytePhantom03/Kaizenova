"use client";

import React, { useEffect, useRef } from "react";
import {
  useMotionValue,
  useSpring,
  useInView,
  useTransform,
  motion,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  /** Target number to count up to */
  value: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Text displayed after the number, e.g. "%" or "/100" */
  suffix?: string;
  /** Text displayed before the number, e.g. "$" */
  prefix?: string;
  /** Number of decimal places to display */
  decimals?: number;
  /** Additional class names */
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const motionValue = useMotionValue(0);

  // Spring config derived from duration – longer duration = softer spring
  const springValue = useSpring(motionValue, {
    stiffness: Math.max(40, 260 - duration * 0.2),
    damping: Math.max(20, 30 + duration * 0.01),
    mass: 1,
  });

  // Format the number while it animates
  const display = useTransform(springValue, (latest: number) =>
    latest.toFixed(decimals)
  );

  // Start animation when in view, re-run when value changes
  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix && <span>{prefix}</span>}
      <motion.span>{display}</motion.span>
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}

AnimatedCounter.displayName = "AnimatedCounter";
