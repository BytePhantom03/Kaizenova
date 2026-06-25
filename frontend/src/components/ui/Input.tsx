"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, success, icon, suffix, onFocus, onBlur, value, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = value !== undefined ? String(value).length > 0 : false;
    const isFloating = focused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const borderColor = error
      ? "border-danger focus-visible:ring-danger/50 focus-visible:border-danger"
      : success
        ? "border-success focus-visible:ring-success/50 focus-visible:border-success"
        : "border-border focus-visible:ring-primary/50 focus-visible:border-primary";

    const glowShadow = error
      ? "focus-visible:shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_0_12px_rgba(239,68,68,0.1)]"
      : success
        ? "focus-visible:shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_0_12px_rgba(16,185,129,0.1)]"
        : "focus-visible:shadow-[0_0_0_1px_rgba(0,240,255,0.3),0_0_12px_rgba(0,240,255,0.1)]";

    return (
      <div className="relative w-full">
        {/* Floating label */}
        {label && (
          <motion.label
            initial={false}
            animate={{
              y: isFloating ? -24 : 0,
              scale: isFloating ? 0.85 : 1,
              x: icon ? (isFloating ? -8 : 28) : (isFloating ? -4 : 0),
              color: error ? '#EF4444' : focused ? '#00F0FF' : '#8B9BB4',
            }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none origin-left z-10"
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {/* Leading icon */}
          {icon && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
              error ? "text-danger" : focused ? "text-primary" : "text-muted-foreground"
            )}>
              {icon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-surface px-3 py-2 text-sm ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
              borderColor,
              glowShadow,
              icon && "pl-10",
              (suffix || success || error) && "pr-10",
              className
            )}
            ref={ref}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            suppressHydrationWarning={true}
            {...props}
          />

          {/* Trailing elements */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {success && !error && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </motion.div>
            )}
            {suffix}
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="flex items-center gap-1.5 mt-1.5 text-xs text-danger"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
Input.displayName = "Input";
