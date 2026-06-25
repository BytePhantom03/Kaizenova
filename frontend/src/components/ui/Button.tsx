"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type MotionConflictProps = "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictProps> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient" | "icon";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;

    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background relative overflow-hidden select-none";

    const variants: Record<string, string> = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_20px_rgba(138,43,226,0.25)] hover:shadow-[0_0_30px_rgba(138,43,226,0.4)]",
      outline: "border border-border bg-transparent hover:bg-muted/50 hover:border-muted-foreground/30 text-foreground",
      ghost: "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
      gradient: "bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_20px_rgba(0,240,255,0.2),0_0_40px_rgba(138,43,226,0.15)] hover:shadow-[0_0_30px_rgba(0,240,255,0.35),0_0_60px_rgba(138,43,226,0.25)]",
      icon: "border border-border bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground",
    };

    const sizes: Record<string, string> = {
      sm: "h-9 px-4 text-xs gap-1.5",
      md: "h-11 px-6 text-sm gap-2",
      lg: "h-14 px-8 text-base gap-2.5",
    };

    const iconSize: Record<string, string> = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    const sizeClass = variant === "icon" ? iconSize[size] : sizes[size];

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          baseStyles,
          variants[variant],
          sizeClass,
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        disabled={isDisabled}
        suppressHydrationWarning={true}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        )}
        {loading ? (
          <span className="ml-1">{children}</span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
