"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import {
  Mic, MessageSquare, Trophy, BookOpen, PenLine,
  Handshake, Presentation, Mail, BookMarked, Zap,
  Crown, Users2, ChevronRight, ArrowLeft,
  TrendingUp, Star, Clock, Sparkles, Target, GraduationCap
} from "lucide-react";
import LearningHub from "@/components/skills/LearningHub";

// ── Types ──────────────────────────────────────────────────────────────────
interface TrainerInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  phase: number;
  skills_measured: string[];
  avg_session_minutes: number;
}

interface ProgressEntry {
  trainer_type: string;
  sessions_count: number;
  avg_score: number | null;
  last_score: number | null;
  best_score: number | null;
  score_trend: number[];
}

// ── Icon map ───────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  "🎙️": <Mic className="h-5 w-5" />,
  "💬": <MessageSquare className="h-5 w-5" />,
  "🏆": <Trophy className="h-5 w-5" />,
  "📚": <BookOpen className="h-5 w-5" />,
  "✏️": <PenLine className="h-5 w-5" />,
  "🤝": <Handshake className="h-5 w-5" />,
  "🎤": <Presentation className="h-5 w-5" />,
  "📧": <Mail className="h-5 w-5" />,
  "📖": <BookMarked className="h-5 w-5" />,
  "⚡": <Zap className="h-5 w-5" />,
  "👔": <Crown className="h-5 w-5" />,
  "🤜": <Users2 className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Speaking: "text-primary border-primary/30 bg-primary/10",
  Certification: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Language: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Professional: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  Writing: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  Mindset: "text-orange-400 border-orange-400/30 bg-orange-400/10",
};

const ROUTE_MAP: Record<string, string> = {
  speaking: "/skills/speaking",
  fluency: "/skills/fluency",
  ielts: "/skills/ielts",
  vocabulary: "/skills/vocabulary",
  grammar: "/skills/grammar",
  hr: "/skills/hr",
  public: "/skills/public",
  email: "/skills/email",
  storytelling: "/skills/storytelling",
  leadership: "/skills/leadership",
  negotiation: "/skills/negotiation",
  confidence: "/skills/confidence",
};

// ── Score bar ──────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7 }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{score.toFixed(0)}</span>
    </div>
  );
}

// ── Category group header ──────────────────────────────────────────────────
function CategoryHeader({ category }: { category: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[category] || "text-muted-foreground border-border bg-surface"}`}>
        {category}
      </div>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

// ── Trainer card ──────────────────────────────────────────────────────────
function TrainerCard({
  trainer, progress, index, onLearn,
}: {
  trainer: TrainerInfo;
  progress?: ProgressEntry;
  index: number;
  onLearn: (id: string) => void;
}) {
  const router = useRouter();
  const route = ROUTE_MAP[trainer.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 border-border bg-card/30 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
      onClick={() => route && router.push(route)}
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            {ICON_MAP[trainer.icon] ?? <Sparkles className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-tight mb-0.5 text-foreground group-hover:text-primary transition-colors">
              {trainer.name}
            </h3>
            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border inline-flex ${CATEGORY_COLORS[trainer.category] || ""}`}>
              {trainer.category}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {trainer.description}
        </p>

        {/* Skills measured */}
        <div className="flex flex-wrap gap-1">
          {trainer.skills_measured.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-border/40 text-muted-foreground">
              {s}
            </span>
          ))}
          {trainer.skills_measured.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-border/40 text-muted-foreground">
              +{trainer.skills_measured.length - 3}
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Clock className="h-3 w-3" /> ~{trainer.avg_session_minutes} min/session
        </div>

        {/* Progress */}
        {progress && progress.sessions_count > 0 && (
          <div className="pt-2 border-t border-border/40 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground/70">{progress.sessions_count} sessions</span>
              <span className="text-primary font-medium">Best: {progress.best_score?.toFixed(0)}</span>
            </div>
            <ScoreBar score={progress.avg_score} />
          </div>
        )}
      </div>

      {/* CTA — two buttons */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={e => { e.stopPropagation(); onLearn(trainer.id); }}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-xl border border-border/60 bg-surface/50 text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          How to Learn
        </button>
        <button
          onClick={() => route && router.push(route)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-xl border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-background transition-all duration-200"
        >
          {progress && progress.sessions_count > 0 ? "Continue" : "Start Practice"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Stats strip ────────────────────────────────────────────────────────────
function StatStrip({ progressList }: { progressList: ProgressEntry[] }) {
  const total = progressList.reduce((s, p) => s + (p.sessions_count || 0), 0);
  const avgScores = progressList.filter(p => p.avg_score !== null).map(p => p.avg_score!);
  const overallAvg = avgScores.length ? (avgScores.reduce((a, b) => a + b, 0) / avgScores.length).toFixed(0) : "—";
  const activeTrainers = progressList.filter(p => p.sessions_count > 0).length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: "Total Sessions", value: total, icon: <Target className="h-4 w-4 text-primary" /> },
        { label: "Active Trainers", value: activeTrainers, icon: <Sparkles className="h-4 w-4 text-yellow-400" /> },
        { label: "Avg Score", value: overallAvg, icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
      ].map(stat => (
        <div key={stat.label} className="rounded-2xl border border-border bg-card/30 p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-border/40 flex items-center justify-center">
            {stat.icon}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main hub page ──────────────────────────────────────────────────────────
export default function SkillsHubPage() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<TrainerInfo[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLearning, setOpenLearning] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [trainersRes, progressRes] = await Promise.all([
          api.get("/skills/trainers"),
          api.get("/skills/progress"),
        ]);
        setTrainers(trainersRes.data);
        setProgress(progressRes.data?.trainers || []);
      } catch {
        setTrainers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progressMap = Object.fromEntries(progress.map(p => [p.trainer_type, p]));

  // Group trainers by category
  const grouped = trainers.reduce<Record<string, TrainerInfo[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">

      {/* Learning hub modal — rendered at root level so it overlays everything */}
      {openLearning && (
        <LearningHub
          trainerType={openLearning}
          onClose={() => setOpenLearning(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                AI Skills Development
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Practice English speaking, fluency, IELTS, grammar, vocabulary, and more with personalised AI coaching and real-time feedback.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium">
              <Star className="h-3 w-3" /> 12 Trainers Live
            </div>
          </div>
        </motion.div>

        {/* Stats strip */}
        {!loading && progress.length > 0 && <StatStrip progressList={progress} />}

        {/* Trainer grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl border border-border bg-card/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([category, categoryTrainers]) => (
              <div key={category}>
                <CategoryHeader category={category} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTrainers.map((t, i) => (
                    <TrainerCard
                      key={t.id}
                      trainer={t}
                      progress={progressMap[t.id]}
                      index={i}
                      onLearn={setOpenLearning}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
