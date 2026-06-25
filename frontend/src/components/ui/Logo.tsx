"use client";
import React from "react";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: "h-7 w-7", iconInner: "h-3.5 w-3.5", text: "text-base" },
  md: { icon: "h-9 w-9", iconInner: "h-4.5 w-4.5", text: "text-lg" },
  lg: { icon: "h-11 w-11", iconInner: "h-5.5 w-5.5", text: "text-xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
      <div className={cn(
        "rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:shadow-[0_0_16px_rgba(0,240,255,0.25)] group-hover:border-primary/50",
        config.icon
      )}>
        <BrainCircuit className={cn("text-primary transition-transform duration-300 group-hover:scale-110", config.iconInner)} />
      </div>
      {showText && (
        <span className={cn("font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent", config.text)}>
          Kaizenova
        </span>
      )}
    </Link>
  );
}
