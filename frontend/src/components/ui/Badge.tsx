import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  size?: "sm" | "md" | "lg"
  pulse?: boolean
  dot?: boolean
  icon?: React.ReactNode
}

function Badge({ className, variant = "default", size = "md", pulse = false, dot = false, icon, children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "border-primary/20 bg-primary/10 text-primary",
    secondary: "border-secondary/20 bg-secondary/10 text-secondary",
    destructive: "border-accent/20 bg-accent/10 text-accent",
    success: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/10 text-warning",
    info: "border-info/20 bg-info/10 text-info",
    outline: "border-border text-foreground bg-transparent",
  }

  const sizes: Record<string, string> = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  }

  const dotColors: Record<string, string> = {
    default: "bg-primary",
    secondary: "bg-secondary",
    destructive: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    info: "bg-info",
    outline: "bg-foreground",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {(pulse || dot) && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span className={cn("absolute inset-0 rounded-full opacity-75 animate-ping", dotColors[variant])} />
          )}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", dotColors[variant])} />
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge }
