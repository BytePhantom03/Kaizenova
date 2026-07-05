"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Activity, Star, Calendar, ArrowRight, PlayCircle,
  LayoutDashboard, BrainCircuit, TrendingUp, Settings,
  LogOut, ChevronLeft, ChevronRight as ChevronRightIcon,
  Flame, Target, Sparkles, Clock, BarChart3, Zap, Menu, X,
  User, Users, Save, Check, CheckCircle2, AlertCircle, Plus, Trash2, BookOpen,
  Mail, Briefcase, Building2, GraduationCap, Code2, Globe,
  UploadCloud, FileText
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import Link from "next/link";
import { Input } from "@/components/ui/Input";

// ─── Types ──────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "analytics" | "growth" | "settings";

interface DashboardStats {
  total_interviews: number;
  readiness_score: number;
  avg_score: number;
  streak_count: number;
  recent_activity: any[];
}

interface AnalyticsReport {
  id: string;
  interview_id: string;
  overall_score: number;
  technical_avg?: number;
  communication_avg?: number;
  confidence_avg?: number;
  grammar_avg?: number;
  weak_areas: string[];
  strong_areas: string[];
  topic_scores?: Record<string, number>;
  created_at: string;
}

interface Recommendation {
  id: string;
  weak_area: string;
  action_plan: any[];
  status: string;
}

interface Profile {
  full_name: string;
  education?: string;
  experience_level?: string;
  target_role?: string;
  target_company?: string;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  timezone?: string;
  skills: { name: string; proficiency?: string }[];
  profile_complete: number;
}

const defaultStats: DashboardStats = {
  total_interviews: 0, readiness_score: 0,
  avg_score: 0, streak_count: 0, recent_activity: [],
};

// ─── Animated Counter ────────────────────────────────────────────────────────
function useAnimatedValue(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/30">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
      <div className="skeleton h-8 w-20 rounded mb-2" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  );
}

// ─── Score Colours ───────────────────────────────────────────────────────────
function scoreColor(v: number) {
  if (v >= 75) return "text-success";
  if (v >= 50) return "text-warning";
  return "text-accent";
}
function scoreBgColor(v: number) {
  if (v >= 75) return "bg-success";
  if (v >= 50) return "bg-warning";
  return "bg-accent";
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, numericValue, icon, iconBg, delay }: {
  label: string; value: string; numericValue: number;
  icon: React.ReactNode; iconBg: string; delay: number;
}) {
  const animatedVal = useAnimatedValue(numericValue);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm
                 hover:border-border/80 hover:bg-card/50 transition-all duration-300 hover:shadow-lg cursor-default"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value.includes('/') || value.includes('%') || value.includes('Days') ? value : animatedVal}</div>
    </motion.div>
  );
}

// ─── Mini Progress Bar ───────────────────────────────────────────────────────
function ProgressBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${scoreColor(value)}`}>{value.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${scoreBgColor(value)}`}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
        />
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, activeTab, onTabChange }: {
  collapsed: boolean; onToggle: () => void;
  activeTab: Tab; onTabChange: (tab: Tab) => void;
}) {
  const router = useRouter();
  const { logout } = useAuthStore();

  const navItems: { icon: React.ReactNode; label: string; tab?: Tab; href?: string }[] = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", tab: "dashboard" },
    { icon: <BrainCircuit className="h-5 w-5" />, label: "Interviews", href: "/interview/setup" },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", tab: "analytics" },
    { icon: <TrendingUp className="h-5 w-5" />, label: "Growth", tab: "growth" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", tab: "settings" },
  ];

  return (
    <motion.aside
      initial={false} animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen border-r border-border bg-surface z-40"
    >
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="h-4 w-4 text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-foreground whitespace-nowrap overflow-hidden"
              >
                Kaizenova
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.tab ? activeTab === item.tab : false;
          return (
            <button
              key={item.label}
              onClick={() => item.tab ? onTabChange(item.tab) : router.push(item.href!)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive ? 'bg-primary/10 text-primary border border-primary/20 sidebar-active-bar' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {item.icon}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-3 space-y-1">
        <button
          onClick={() => { logout(); router.push("/auth/login"); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs">
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

// ─── ANALYTICS TAB ───────────────────────────────────────────────────────────
function AnalyticsTab() {
  const router = useRouter();
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch recent activity which contains report IDs
        const statsRes = await api.get("/analytics/dashboard");
        const activity = statsRes.data.recent_activity || [];
        // Fetch each report's detail
        const details = await Promise.all(
          activity.map(async (a: any) => {
            try {
              const r = await api.get(`/analytics/reports/${a.id}`);
              return r.data;
            } catch { return null; }
          })
        );
        setReports(details.filter(Boolean));
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="p-6 rounded-2xl border border-border bg-card/30 animate-pulse">
          <div className="h-5 w-48 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map(j => <div key={j} className="h-4 w-full bg-muted rounded" />)}
          </div>
        </div>
      ))}
    </div>
  );

  if (reports.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <BarChart3 className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">No analytics yet</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Complete at least one interview to see your detailed performance analytics here.
      </p>
      <Button onClick={() => router.push("/interview/setup")} className="gap-2">
        <PlayCircle className="h-4 w-4" /> Start Interview
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Performance Analytics</h2>
        <p className="text-sm text-muted-foreground">Detailed breakdown of your interview performance across all sessions.</p>
      </div>

      {/* Score trend */}
      <div className="rounded-2xl border border-border bg-card/30 p-6">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Score Trend
        </h3>
        <div className="space-y-3">
          {reports.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${scoreBgColor(r.overall_score)}`}
                  initial={{ width: 0 }} animate={{ width: `${r.overall_score}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
              <span className={`text-xs font-bold w-10 text-right ${scoreColor(r.overall_score)}`}>
                {r.overall_score.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill breakdown per interview */}
      {reports.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl border border-border bg-card/30 p-6 cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => router.push(`/report/${r.id}`)}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Interview #{reports.length - i}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className={`text-xl font-bold ${scoreColor(r.overall_score)}`}>
              {r.overall_score.toFixed(0)}%
            </div>
          </div>

          <div className="space-y-3">
            {r.technical_avg != null && <ProgressBar label="Technical Accuracy" value={r.technical_avg} delay={0.1} />}
            {r.communication_avg != null && <ProgressBar label="Communication" value={r.communication_avg} delay={0.15} />}
            {r.confidence_avg != null && <ProgressBar label="Confidence" value={r.confidence_avg} delay={0.2} />}
            {r.grammar_avg != null && <ProgressBar label="Grammar & Syntax" value={r.grammar_avg} delay={0.25} />}
          </div>

          {(r.strong_areas.length > 0 || r.weak_areas.length > 0) && (
            <div className="grid grid-cols-2 gap-3 mt-5">
              {r.strong_areas.length > 0 && (
                <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                  <div className="text-xs font-semibold text-success mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Strong
                  </div>
                  {r.strong_areas.slice(0, 3).map((a, j) => (
                    <div key={j} className="text-xs text-success/80 truncate">• {a}</div>
                  ))}
                </div>
              )}
              {r.weak_areas.length > 0 && (
                <div className="rounded-xl bg-accent/5 border border-accent/20 p-3">
                  <div className="text-xs font-semibold text-accent mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Improve
                  </div>
                  {r.weak_areas.slice(0, 3).map((a, j) => (
                    <div key={j} className="text-xs text-accent/80 truncate">• {a}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-1 text-xs text-primary">
            View full report <ArrowRight className="h-3 w-3" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── GROWTH TAB ──────────────────────────────────────────────────────────────
// ─── Sparkline component ──────────────────────────────────────────────────────
function Sparkline({ values, color = "#00f0ff" }: { values: number[]; color?: string }) {
  if (!values || values.length < 2) {
    return <div className="text-xs text-muted-foreground/50 italic">No trend yet</div>;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80, h = 28, pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return i === values.length - 1 ? (
          <circle key={i} cx={x} cy={y} r="3" fill={color} />
        ) : null;
      })}
    </svg>
  );
}

// ─── Circular Score Gauge ─────────────────────────────────────────────────────
function ScoreGauge({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 60 ? "#eab308" : "#f43f5e";
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <text x={size / 2} y={size / 2 + 5}
        textAnchor="middle" className="rotate-90"
        style={{ fontSize: 14, fontWeight: 700, fill: color, transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

// ─── Skill types ──────────────────────────────────────────────────────────────
interface SkillData {
  label: string; avg_score: number; trend: number[]; status: string;
  tips: { id: string; text: string; order: number }[];
  stages: Record<number, { id: string; title: string; description: string; difficulty: string; is_completed: boolean; completed_at: string | null; order: number }[]>;
  total_exercises: number; completed_exercises: number;
}

// ─── GROWTH TAB ──────────────────────────────────────────────────────────────
function GrowthTab() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<{ avg_scores: Record<string, number>; skills: Record<string, SkillData>; timeline: any[] } | null>(null);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [openSkill, setOpenSkill] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const [apiError, setApiError] = useState(false);

  const fetchOverview = async () => {
    setApiError(false);
    try {
      const res = await api.get("/improvement/overview");
      setOverview(res.data);
    } catch (err: any) {
      console.error("Improvement overview error:", err?.response?.data || err.message);
      setApiError(true);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOverview(); }, []);

  const handleGenerate = async (skill: string) => {
    setGenerating(g => ({ ...g, [skill]: true }));
    try {
      await api.post(`/improvement/${skill}/generate`);
      await fetchOverview();
    } catch { /* ignore */ }
    finally { setGenerating(g => ({ ...g, [skill]: false })); }
  };

  const handleToggle = async (exerciseId: string, isCompleted: boolean) => {
    setToggling(t => ({ ...t, [exerciseId]: true }));
    try {
      const endpoint = isCompleted ? `/improvement/exercises/${exerciseId}/uncomplete` : `/improvement/exercises/${exerciseId}/complete`;
      await api.patch(endpoint);
      await fetchOverview();
    } catch { /* ignore */ }
    finally { setToggling(t => ({ ...t, [exerciseId]: false })); }
  };

  const skillColors: Record<string, { sparkColor: string; icon: React.ReactNode }> = {
    communication: { sparkColor: "#00f0ff", icon: <Users className="h-4 w-4 text-primary" /> },
    confidence: { sparkColor: "#a855f7", icon: <Zap className="h-4 w-4 text-purple-400" /> },
    grammar: { sparkColor: "#f59e0b", icon: <BookOpen className="h-4 w-4 text-warning" /> },
  };

  const statusBadge = (s: string) => {
    if (s === "strong") return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Strong</span>;
    if (s === "improving") return <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">Improving</span>;
    return <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">Needs Work</span>;
  };

  const diffColor = (d: string) => d === "easy" ? "text-emerald-400" : d === "medium" ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Skill Improvement Hub</h2>
        <p className="text-sm text-muted-foreground">
          Scores are computed from all your interview sessions. AI generates personalised tips and a practice roadmap for each weak skill.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-40 rounded-2xl border border-border bg-card/30 animate-pulse" />)}
        </div>
      ) : apiError ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-accent/30 bg-accent/5">
          <AlertCircle className="h-12 w-12 text-accent/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Could not load skill data</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            There was an error connecting to the improvement service. The backend may still be starting up.
          </p>
          <Button variant="outline" onClick={() => { setLoading(true); fetchOverview(); }} className="gap-2">
            <Activity className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : !overview ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/20">
          <BrainCircuit className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No interview data yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Complete at least one interview to see your skill scores and get personalised improvement plans.
          </p>
          <Button onClick={() => router.push("/interview/setup")} className="gap-2">
            <PlayCircle className="h-4 w-4" /> Start an Interview
          </Button>
        </div>
      ) : (
        <>
          {/* ── Block 1: Skill Health Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(overview.skills).map(([skill, data]) => {
              const sc = skillColors[skill] || { sparkColor: "#00f0ff", icon: <Star className="h-4 w-4" /> };
              return (
                <motion.div key={skill} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card/30 p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">{sc.icon}</div>
                        <span className="text-sm font-semibold text-foreground">{data.label}</span>
                      </div>
                      {statusBadge(data.status)}
                    </div>
                    <ScoreGauge score={data.avg_score} />
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">Last 5 sessions</div>
                    <Sparkline values={data.trend} color={sc.sparkColor} />
                  </div>

                  {data.status === "weak" && (
                    <button
                      onClick={() => setOpenSkill(openSkill === skill ? null : skill)}
                      className="w-full text-xs font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg py-2 transition-colors"
                    >
                      {openSkill === skill ? "▲ Hide Plan" : "▼ View Tips & Roadmap"}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ── Block 2 + 3: Tips & Roadmap (expands per skill) ── */}
          {Object.entries(overview.skills).map(([skill, data]) => {
            if (data.status !== "weak" && openSkill !== skill) return null;
            if (openSkill !== skill && data.status === "weak") return null;
            const isOpen = openSkill === skill;
            if (!isOpen) return null;

            const sc = skillColors[skill] || { sparkColor: "#00f0ff", icon: <Star className="h-4 w-4" /> };
            const stage1Done = data.stages[1]?.every(e => e.is_completed) ?? false;
            const stage2Done = data.stages[2]?.every(e => e.is_completed) ?? false;

            return (
              <motion.div key={`plan-${skill}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card/30 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">{sc.icon}</div>
                    <span className="font-semibold text-foreground">{data.label} Improvement Plan</span>
                    <span className="text-xs text-muted-foreground ml-2">({data.completed_exercises}/{data.total_exercises} exercises done)</span>
                  </div>
                  <button
                    onClick={() => handleGenerate(skill)}
                    disabled={generating[skill]}
                    className="text-xs px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generating[skill]
                      ? <><div className="h-3 w-3 rounded-full border border-primary/40 border-t-primary animate-spin" /> Generating...</>
                      : <><Sparkles className="h-3 w-3" /> {data.total_exercises > 0 ? "Refresh" : "Generate"} AI Plan</>
                    }
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* AI Tips */}
                  {data.tips.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> AI Improvement Tips
                      </h4>
                      <div className="space-y-2">
                        {data.tips.map((tip, i) => (
                          <div key={tip.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface/50">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : data.total_exercises === 0 && !generating[skill] ? (
                    <div className="text-center py-6 rounded-xl border border-dashed border-border">
                      <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">No AI tips yet. Click "Generate AI Plan" to get started.</p>
                    </div>
                  ) : null}

                  {/* Exercise Roadmap */}
                  {data.total_exercises > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-secondary" /> Practice Roadmap
                      </h4>

                      {/* Overall progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Overall Progress</span>
                          <span>{data.completed_exercises}/{data.total_exercises}</span>
                        </div>
                        <div className="h-2 w-full bg-border/50 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                            initial={{ width: 0 }}
                            animate={{ width: `${data.total_exercises > 0 ? (data.completed_exercises / data.total_exercises) * 100 : 0}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[1, 2, 3].map(stageNum => {
                          const stageExercises = data.stages[stageNum] || [];
                          const stageDone = stageExercises.filter(e => e.is_completed).length;
                          const stageLocked = (stageNum === 2 && !stage1Done) || (stageNum === 3 && !stage2Done);
                          const stageLabels: Record<number, string> = { 1: "Foundations", 2: "Intermediate", 3: "Advanced" };

                          return (
                            <div key={stageNum} className={`rounded-xl border overflow-hidden ${stageLocked ? "border-border/30 opacity-60" : "border-border"}`}>
                              <div className={`px-4 py-3 flex items-center justify-between ${stageLocked ? "bg-muted/20" : "bg-surface/50"}`}>
                                <div className="flex items-center gap-2">
                                  {stageLocked
                                    ? <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center"><span className="text-[10px]">🔒</span></div>
                                    : <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{stageNum}</div>
                                  }
                                  <span className="text-sm font-medium text-foreground">
                                    Stage {stageNum}: {stageLabels[stageNum]}
                                  </span>
                                  {!stageLocked && stageDone === stageExercises.length && stageExercises.length > 0 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅ Complete</span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{stageDone}/{stageExercises.length}</span>
                              </div>

                              {!stageLocked && stageExercises.length > 0 && (
                                <div className="divide-y divide-border/30">
                                  {stageExercises.sort((a, b) => a.order - b.order).map(ex => (
                                    <div key={ex.id} className="px-4 py-3 flex items-start gap-3 hover:bg-surface/30 transition-colors">
                                      <button
                                        onClick={() => handleToggle(ex.id, ex.is_completed)}
                                        disabled={toggling[ex.id]}
                                        className={`h-5 w-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                          ex.is_completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-border hover:border-primary"
                                        }`}
                                      >
                                        {toggling[ex.id]
                                          ? <div className="h-3 w-3 rounded-full border border-white/30 border-t-white animate-spin" />
                                          : ex.is_completed ? <Check className="h-3 w-3" /> : null
                                        }
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium ${ex.is_completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                          {ex.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ex.description}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className={`text-[11px] font-medium ${diffColor(ex.difficulty)}`}>{ex.difficulty}</span>
                                          {ex.completed_at && (
                                            <span className="text-[11px] text-muted-foreground/60">
                                              ✓ {new Date(ex.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {stageLocked && (
                                <div className="px-4 py-3 text-xs text-muted-foreground/60 italic">
                                  Complete Stage {stageNum - 1} first to unlock this stage.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* ── Block 4: Progress Timeline ── */}
          {overview.timeline.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card/30 p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Completion Timeline
              </h3>
              <div className="space-y-2">
                {overview.timeline.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Completed <span className="text-foreground font-medium">"{item.title}"</span>
                      <span className="text-muted-foreground/60 ml-1.5">
                        · {item.completed_at ? new Date(item.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SETTINGS TAB ────────────────────────────────────────────────────────────

function SettingsTab() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: user?.full_name || "", skills: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/profile/me");
        setProfile(res.data);
      } catch {
        setProfile({ full_name: user?.full_name || "", skills: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/profile/me", profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setProfile(p => ({ ...p, skills: [...(p.skills || []), { name: newSkill.trim() }] }));
    setNewSkill("");
  };

  const removeSkill = (i: number) => {
    setProfile(p => ({ ...p, skills: (p.skills || []).filter((_, idx) => idx !== i) }));
  };

  if (loading) return (
    <div className="space-y-4">
      {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-2xl border border-border bg-card/30 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Account Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile and interview preferences.</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-border bg-card/30 p-6">
        <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Profile Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Full Name", key: "full_name", placeholder: "Your name", icon: <User className="h-4 w-4" /> },
            { label: "Target Role", key: "target_role", placeholder: "e.g. Software Engineer", icon: <Briefcase className="h-4 w-4" /> },
            { label: "Target Company", key: "target_company", placeholder: "e.g. Google", icon: <Building2 className="h-4 w-4" /> },
            { label: "Education", key: "education", placeholder: "e.g. B.Tech Computer Science", icon: <GraduationCap className="h-4 w-4" /> },
            { label: "Experience Level", key: "experience_level", placeholder: "Entry / Mid / Senior", icon: <TrendingUp className="h-4 w-4" /> },
            { label: "LinkedIn URL", key: "linkedin_url", placeholder: "https://linkedin.com/in/...", icon: <Globe className="h-4 w-4" /> },
            { label: "GitHub URL", key: "github_url", placeholder: "https://github.com/...", icon: <Code2 className="h-4 w-4" /> },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">{f.label}</label>
              <Input
                type="text"
                value={(profile as any)[f.key] || ""}
                onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                icon={f.icon}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Bio</label>
            <textarea
              rows={3}
              value={profile.bio || ""}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="A short description about yourself..."
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3),0_0_12px_rgba(0,240,255,0.1)]"
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-border bg-card/30 p-6">
        <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Skills
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {(profile.skills || []).map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              {s.name}
              <button onClick={() => removeSkill(i)} className="hover:text-accent transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {profile.skills?.length === 0 && (
            <span className="text-sm text-muted-foreground">No skills added yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSkill()}
            placeholder="Add a skill (e.g. Python, React)"
            icon={<Sparkles className="h-4 w-4" />}
          />
          <Button onClick={addSkill} size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Profile saved!
            </motion.div>
          )}
        </AnimatePresence>
        <Button onClick={handleSave} disabled={saving} className="gap-2 ml-auto">
          {saving ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
        <h3 className="text-base font-semibold text-accent mb-2">Sign Out</h3>
        <p className="text-sm text-muted-foreground mb-4">You will be redirected to the login page.</p>
        <Button
          variant="outline"
          className="border-accent/30 text-accent hover:bg-accent/10 gap-2"
          onClick={() => { logout(); router.push("/auth/login"); }}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

// ─── Resume Interview Card ────────────────────────────────────────────────────
function ResumeInterviewCard({ router }: { router: any }) {
  const [status, setStatus] = React.useState<"idle" | "uploading" | "done" | "error">("idle");
  const [isDragging, setIsDragging] = React.useState(false);
  const [resumeData, setResumeData] = React.useState<{
    resume_id: string; file_name: string; detected_role: string;
    experience_years: number; key_skills: string[]; difficulty_setting: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx") && !lower.endsWith(".txt")) {
      setErrorMsg("Please upload a PDF, DOCX, or TXT file.");
      setStatus("error");
      return;
    }
    setStatus("uploading");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeData(res.data);
      setStatus("done");
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || "Upload failed. Please try again.");
      setStatus("error");
    }
  };

  const handleStartInterview = () => {
    if (!resumeData) return;
    const params = new URLSearchParams({
      resume_id: resumeData.resume_id,
      difficulty: resumeData.difficulty_setting,
      ...(resumeData.detected_role ? { role: resumeData.detected_role } : {}),
    });
    router.push(`/interview/setup?${params.toString()}`);
  };

  const difficultyColor: Record<string, string> = {
    beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    intermediate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    advanced: "text-accent bg-accent/10 border-accent/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/50 to-secondary/5 p-6 overflow-hidden relative"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-primary/10 blur-[50px] pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Resume Interview</h3>
            <p className="text-xs text-muted-foreground">AI tailors questions from your resume</p>
          </div>
        </div>

        {status === "idle" || status === "error" ? (
          <>
            <div
              className={`rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                isDragging ? "border-primary bg-primary/10 scale-[1.01]" :
                status === "error" ? "border-accent/40 bg-accent/5" :
                "border-border/60 bg-card/20 hover:border-primary/40 hover:bg-primary/5"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                <UploadCloud className={`h-8 w-8 ${status === "error" ? "text-accent" : "text-primary/60"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {status === "error" ? errorMsg : "Drop your resume here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX or TXT • Click or drag & drop</p>
                </div>
              </div>
            </div>
          </>
        ) : status === "uploading" ? (
          <div className="rounded-xl border border-border bg-card/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Analysing resume with AI...</p>
                <p className="text-xs text-muted-foreground">Detecting experience level & skills</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: "0%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        ) : (
          /* Done state */
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-400">Resume analysed!</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{resumeData?.file_name}</p>
                </div>
                <button
                  onClick={() => { setStatus("idle"); setResumeData(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted/50 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {resumeData && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {resumeData.detected_role && (
                    <div className="col-span-2 text-muted-foreground">
                      Role detected: <span className="text-foreground font-medium">{resumeData.detected_role}</span>
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    Experience: <span className="text-foreground font-medium">{resumeData.experience_years}+ yrs</span>
                  </div>
                  <div className="text-muted-foreground">
                    Difficulty: <span className={`font-medium px-1.5 py-0.5 rounded-md border text-[11px] ${difficultyColor[resumeData.difficulty_setting] || ""}`}>
                      {resumeData.difficulty_setting}
                    </span>
                  </div>
                  {resumeData.key_skills.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Top skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {resumeData.key_skills.slice(0, 5).map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button onClick={handleStartInterview} className="w-full gap-2 shadow-glow-primary">
              <BrainCircuit className="h-4 w-4" /> Start Resume Interview
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DashboardTab({ stats, loading, router, firstName, getGreeting, onTabChange }: {
  stats: DashboardStats; loading: boolean; router: any; firstName: string; getGreeting: () => string; onTabChange?: (tab: Tab) => void;
}) {
  const [recUrl, setRecUrl] = useState("/interview/setup");

  // Build a smart recommended session URL based on latest performance
  useEffect(() => {
    if (stats.recent_activity.length === 0) return;
    const buildRecUrl = async () => {
      try {
        const latestId = stats.recent_activity[0].id;
        const res = await api.get(`/analytics/reports/${latestId}`);
        const report = res.data;
        const weakAreas: string[] = report.weak_areas || [];
        const avgScore = stats.avg_score;
        // Determine recommended difficulty based on avg score
        const difficulty = avgScore >= 70 ? "advanced" : avgScore >= 45 ? "intermediate" : "beginner";
        // Pick a domain from weak areas or default
        const domainMap: Record<string, string> = {
          "algorithms": "Software Engineering", "data structures": "Software Engineering",
          "system design": "Software Engineering", "communication": "Software Engineering",
          "frontend": "Frontend", "backend": "Backend", "database": "Backend",
          "machine learning": "Data Science", "devops": "DevOps",
        };
        let domain = "Software Engineering";
        for (const area of weakAreas) {
          const key = Object.keys(domainMap).find(k => area.toLowerCase().includes(k));
          if (key) { domain = domainMap[key]; break; }
        }
        const params = new URLSearchParams({
          recommended: "true",
          domain,
          type: "technical",
          difficulty,
        });
        setRecUrl(`/interview/setup?${params.toString()}`);
      } catch {
        // fallback to generic setup
      }
    };
    buildRecUrl();
  }, [stats]);

  if (loading) return (
    <div className="space-y-8">
      <div><div className="skeleton h-8 w-64 rounded mb-2" /><div className="skeleton h-4 w-48 rounded" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-foreground">
            {getGreeting()}, {firstName} 👋
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }} className="text-muted-foreground mt-1">
            Here&apos;s your interview readiness overview.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button onClick={() => router.push("/interview/setup")} className="gap-2 shadow-glow-primary">
            <PlayCircle className="h-4 w-4" /> Start Mock Interview
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Readiness Score" value={`${stats.readiness_score}/100`} numericValue={stats.readiness_score} icon={<Star className="h-5 w-5 text-yellow-400" />} iconBg="bg-yellow-400/10" delay={0.05} />
        <StatCard label="Interviews Completed" value={String(stats.total_interviews)} numericValue={stats.total_interviews} icon={<Activity className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0.1} />
        <StatCard label="Avg. Performance" value={`${stats.avg_score}%`} numericValue={stats.avg_score} icon={<Target className="h-5 w-5 text-secondary" />} iconBg="bg-secondary/10" delay={0.15} />
        <StatCard label="Current Streak" value={`${stats.streak_count} Days`} numericValue={stats.streak_count} icon={<Flame className="h-5 w-5 text-accent" />} iconBg="bg-accent/10" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card/30 p-6 h-full">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => router.push("/interview/setup")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:border-primary/30 transition-all group">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">Quick Interview</div>
                  <div className="text-xs text-muted-foreground">Start a practice session</div>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
              </button>
              <button onClick={() => onTabChange && onTabChange('analytics')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:border-secondary/30 transition-all group">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">View Analytics</div>
                  <div className="text-xs text-muted-foreground">Performance breakdown</div>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-secondary transition-colors" />
              </button>
              <button onClick={() => onTabChange && onTabChange('growth')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:border-success/30 transition-all group">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">Growth Plan</div>
                  <div className="text-xs text-muted-foreground">AI-powered coaching</div>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-success transition-colors" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Coach */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/50 to-secondary/5 p-6 h-full overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center breathe-glow">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Coach</h3>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-success">Active</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-surface/50 border border-border p-4 mb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stats.total_interviews === 0
                    ? "Welcome to Kaizenova! Start your first mock interview to receive personalized coaching recommendations."
                    : `Great progress! You've completed ${stats.total_interviews} interview${stats.total_interviews !== 1 ? 's' : ''} with an average score of ${stats.avg_score}%.`
                  }
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(recUrl)}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10">
                <BrainCircuit className="h-3.5 w-3.5 mr-1.5" /> Start Recommended Session
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Resume Interview Card */}
        <div className="lg:col-span-1">
          <ResumeInterviewCard router={router} />
        </div>
      </div>

      {stats.recent_activity.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
              <span className="text-xs text-muted-foreground">{stats.recent_activity.length} sessions</span>
            </div>
            <div className="divide-y divide-border/50">
              {stats.recent_activity.map((activity, i) => {
                const score = activity.score;
                const colorClass = score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-accent';
                const bgClass = score >= 75 ? 'bg-success/10' : score >= 50 ? 'bg-warning/10' : 'bg-accent/10';
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    onClick={() => router.push(`/report/${activity.id}`)}
                    className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <BrainCircuit className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Interview Session</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold px-3 py-1 rounded-lg ${colorClass} ${bgClass}`}>
                      {score.toFixed(1)}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="relative rounded-2xl border border-dashed border-border bg-card/20 p-12 text-center overflow-hidden">
          <div className="relative z-10">
            <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-center">
              <BrainCircuit className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Your journey starts here</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Start your first AI-powered mock interview and see your performance analytics appear here.
            </p>
            <Button onClick={() => router.push("/interview/setup")} className="gap-2 shadow-glow-primary">
              <PlayCircle className="h-4 w-4" /> Start Your First Interview
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    const fetchStats = async () => {
      try {
        const res = await api.get("/analytics/dashboard");
        setStats(res.data);
      } catch {
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  const firstName = user.full_name?.split(" ")[0] ?? "there";

  const mobileNavItems: { label: string; icon: React.ReactNode; tab?: Tab; href?: string }[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, tab: "dashboard" },
    { label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, tab: "analytics" },
    { label: "Growth", icon: <TrendingUp className="h-4 w-4" />, tab: "growth" },
    { label: "New Interview", icon: <BrainCircuit className="h-4 w-4" />, href: "/interview/setup" },
    { label: "Settings", icon: <Settings className="h-4 w-4" />, tab: "settings" },
  ];

  const tabTitles: Record<Tab, string> = {
    dashboard: "Dashboard", analytics: "Analytics", growth: "Growth", settings: "Settings"
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onTabChange={(t) => { setActiveTab(t); setMobileMenuOpen(false); }}
      />

      {/* Mobile Header */}
      <header className="lg:hidden border-b border-border glass-strong sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-muted-foreground hover:text-foreground">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">Kaizenova</span>
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            {user.full_name?.charAt(0) ?? "?"}
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden">
              <nav className="p-3 space-y-1">
                {mobileNavItems.map(item => (
                  <button key={item.label}
                    onClick={() => { item.tab ? setActiveTab(item.tab) : router.push(item.href!); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${item.tab && activeTab === item.tab ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
                <button onClick={() => { logout(); router.push("/auth/login"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-accent">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <motion.main
        initial={false}
        animate={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarCollapsed ? 72 : 240) : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen"
      >
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex border-b border-border glass-strong sticky top-0 z-30">
          <div className="flex-1 px-8 h-16 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">{tabTitles[activeTab]}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.full_name}</span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                {user.full_name?.charAt(0) ?? "?"}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "dashboard" && (
                <DashboardTab stats={stats} loading={loading} router={router} firstName={firstName} getGreeting={getGreeting} onTabChange={(t) => { setActiveTab(t); setMobileMenuOpen(false); }} />
              )}
              {activeTab === "analytics" && <AnalyticsTab />}
              {activeTab === "growth" && <GrowthTab />}
              {activeTab === "settings" && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}
