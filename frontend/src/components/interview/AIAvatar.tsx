"use client";
import React, { useEffect, useRef } from "react";
import { motion, useAnimationControls, AnimatePresence } from "framer-motion";

interface AIAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  size?: number;
}

/* ── Mouth shape calculator ─────────────────────────────────────────────── */
function MouthPath({ open }: { open: boolean }) {
  // Closed mouth: thin smile arc. Open mouth: wider oval
  const d = open
    ? "M 58 82 Q 80 100 102 82"  // wide open
    : "M 62 85 Q 80 93 98 85";   // closed smile
  return (
    <motion.path
      d={d}
      stroke="#00f0ff"
      strokeWidth={3.5}
      strokeLinecap="round"
      fill={open ? "rgba(0,240,255,0.12)" : "none"}
      animate={{ d }}
      transition={{ duration: 0.07, ease: "easeInOut" }}
    />
  );
}

/* ── Eye component with blink ───────────────────────────────────────────── */
function Eye({ cx, cy, isThinking }: { cx: number; cy: number; isThinking: boolean }) {
  const controls = useAnimationControls();

  // Natural blink loop
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const blink = async () => {
      await controls.start({ scaleY: 0.08, transition: { duration: 0.06 } });
      await controls.start({ scaleY: 1, transition: { duration: 0.06 } });
      // Schedule next blink randomly between 2–5 seconds
      const delay = 2000 + Math.random() * 3000;
      timeout = setTimeout(blink, delay);
    };
    timeout = setTimeout(blink, 1000 + Math.random() * 1500);
    return () => clearTimeout(timeout);
  }, [controls]);

  return (
    <motion.g animate={controls} style={{ originX: `${cx}px`, originY: `${cy}px` }}>
      {/* Eye white */}
      <motion.ellipse
        cx={cx} cy={cy} rx={11} ry={11}
        fill="rgba(0,240,255,0.12)"
        stroke="rgba(0,240,255,0.5)"
        strokeWidth={1.5}
        animate={isThinking ? { rx: [11, 9, 11] } : { rx: 11 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {/* Pupil */}
      <motion.circle
        cx={cx} cy={cy} r={5}
        fill="#00f0ff"
        animate={isThinking
          ? { cx: [cx, cx + 3, cx, cx - 3, cx] }
          : { cx }
        }
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {/* Highlight */}
      <circle cx={cx + 3} cy={cy - 3} r={2} fill="rgba(255,255,255,0.7)" />
    </motion.g>
  );
}

/* ── Signal bars (listening indicator) ─────────────────────────────────── */
function SignalBars() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-red-400"
          style={{ height: `${h * 100}%` }}
          animate={{ scaleY: [h, 1, h * 0.5, 1, h] }}
          transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Speaking mouth animation hook ─────────────────────────────────────── */
function useMouthAnimation(isSpeaking: boolean) {
  const [open, setOpen] = React.useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSpeaking) {
      // Oscillate mouth open/close at ~8 times/sec for natural speech look
      intervalRef.current = setInterval(() => {
        setOpen(prev => !prev);
      }, 120);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setOpen(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSpeaking]);

  return open;
}

/* ── Main Avatar component ──────────────────────────────────────────────── */
export default function AIAvatar({ isSpeaking, isListening, isThinking, size = 200 }: AIAvatarProps) {
  const mouthOpen = useMouthAnimation(isSpeaking);
  const scale = size / 200;

  // Status label
  const statusLabel = isSpeaking ? "Interviewer Speaking" : isListening ? "Listening..." : isThinking ? "Thinking..." : "AI Interviewer";
  const statusColor = isSpeaking ? "text-primary" : isListening ? "text-red-400" : isThinking ? "text-yellow-400" : "text-muted-foreground";
  const glowColor = isSpeaking ? "rgba(0,240,255,0.35)" : isListening ? "rgba(244,63,94,0.25)" : "rgba(0,240,255,0.1)";
  const glowBorder = isSpeaking ? "border-primary/40" : isListening ? "border-red-400/40" : "border-primary/20";

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Outer glow container */}
      <motion.div
        className={`relative rounded-3xl border ${glowBorder} bg-card/30 backdrop-blur-sm p-4`}
        style={{ boxShadow: `0 0 32px ${glowColor}, 0 0 8px ${glowColor}` }}
        animate={{
          boxShadow: isSpeaking
            ? [`0 0 32px ${glowColor}, 0 0 8px ${glowColor}`, `0 0 52px ${glowColor}, 0 0 16px ${glowColor}`, `0 0 32px ${glowColor}, 0 0 8px ${glowColor}`]
            : `0 0 24px ${glowColor}`
        }}
        transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
      >
        {/* Gentle body bob */}
        <motion.div
          animate={{
            y: isThinking ? [0, -4, 0] : [0, -3, 0],
            rotate: isThinking ? [0, 1, -1, 0] : [0, 0.5, -0.5, 0],
          }}
          transition={{ duration: isThinking ? 1.2 : 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* SVG Face */}
          <svg
            width={size}
            height={size}
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head */}
            <rect x="20" y="20" width="120" height="120" rx="28" ry="28"
              fill="rgba(10,20,35,0.9)"
              stroke="rgba(0,240,255,0.3)"
              strokeWidth="2"
            />

            {/* Inner face panel */}
            <rect x="28" y="28" width="104" height="104" rx="20" ry="20"
              fill="rgba(0,240,255,0.04)"
              stroke="rgba(0,240,255,0.12)"
              strokeWidth="1"
            />

            {/* Antenna */}
            <motion.line x1="80" y1="20" x2="80" y2="10" stroke="rgba(0,240,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
            <motion.circle
              cx="80" cy="7" r="4"
              fill="#00f0ff"
              animate={{ r: [4, 5.5, 4], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Left ear bolt */}
            <rect x="14" y="62" width="8" height="16" rx="3" fill="rgba(0,240,255,0.2)" stroke="rgba(0,240,255,0.3)" strokeWidth="1" />
            {/* Right ear bolt */}
            <rect x="138" y="62" width="8" height="16" rx="3" fill="rgba(0,240,255,0.2)" stroke="rgba(0,240,255,0.3)" strokeWidth="1" />

            {/* Eyes */}
            <Eye cx={57} cy={65} isThinking={isThinking} />
            <Eye cx={103} cy={65} isThinking={isThinking} />

            {/* Eyebrows */}
            <motion.path
              d="M 46 51 Q 57 47 68 51"
              stroke="rgba(0,240,255,0.6)"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              animate={isThinking
                ? { d: "M 46 49 Q 57 53 68 49" }  // furrowed
                : { d: "M 46 51 Q 57 47 68 51" }   // normal
              }
              transition={{ duration: 0.4 }}
            />
            <motion.path
              d="M 92 51 Q 103 47 114 51"
              stroke="rgba(0,240,255,0.6)"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              animate={isThinking
                ? { d: "M 92 49 Q 103 53 114 49" }
                : { d: "M 92 51 Q 103 47 114 51" }
              }
              transition={{ duration: 0.4 }}
            />

            {/* Nose dot */}
            <circle cx="80" cy="78" r="2" fill="rgba(0,240,255,0.3)" />

            {/* Mouth */}
            <MouthPath open={mouthOpen} />

            {/* Chin panel / display strip */}
            <rect x="44" y="104" width="72" height="8" rx="4"
              fill="rgba(0,240,255,0.06)"
              stroke="rgba(0,240,255,0.15)"
              strokeWidth="1"
            />
            {/* Status dots on chin panel */}
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.circle
                key={i}
                cx={52 + i * 14} cy={108} r={2.5}
                fill={i < 3 ? "#00f0ff" : "rgba(0,240,255,0.2)"}
                animate={isSpeaking
                  ? { opacity: [1, 0.2, 1], fill: ["#00f0ff", "rgba(0,240,255,0.2)", "#00f0ff"] }
                  : { opacity: 1 }
                }
                transition={{ duration: 0.5, delay: i * 0.1, repeat: isSpeaking ? Infinity : 0 }}
              />
            ))}
          </svg>
        </motion.div>

        {/* Listening indicator overlay */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-2 right-2"
            >
              <SignalBars />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status label */}
      <motion.div
        key={statusLabel}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-xs font-medium tracking-wide ${statusColor} flex items-center gap-1.5`}
      >
        {isSpeaking && (
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-primary inline-block"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
        {isListening && (
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        )}
        {statusLabel}
      </motion.div>
    </div>
  );
}
