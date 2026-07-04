"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />,
  info: <Info className="h-4 w-4 text-info flex-shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />,
};

const borders: Record<ToastVariant, string> = {
  success: "border-success/30",
  error: "border-danger/30",
  info: "border-info/30",
  warning: "border-warning/30",
};

const progressColors: Record<ToastVariant, string> = {
  success: "bg-success",
  error: "bg-danger",
  info: "bg-info",
  warning: "bg-warning",
};

function ToastComponent({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "relative w-80 overflow-hidden rounded-xl border bg-card shadow-xl backdrop-blur-xl",
        borders[item.variant]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {icons[item.variant]}
        <p className="text-sm text-foreground flex-1 leading-relaxed">{item.message}</p>
        <button
          onClick={() => onRemove(item.id)}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 -mt-0.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-border/50">
        <div
          className={cn("h-full", progressColors[item.variant])}
          style={{
            animation: `toastProgress ${item.duration}ms linear forwards`,
          }}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const item: ToastItem = { id, message, variant, duration };
      setToasts((prev) => [...prev.slice(-4), item]); // max 5 toasts

      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <ToastComponent item={item} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
