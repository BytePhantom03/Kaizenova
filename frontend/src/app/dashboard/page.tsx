"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Activity, Star, Calendar, ArrowRight, PlayCircle,
  LayoutDashboard, BrainCircuit, TrendingUp, Settings,
  LogOut, ChevronLeft, ChevronRight as ChevronRightIcon,
  Flame, Target, Sparkles, Clock, BarChart3, Zap, Menu, X
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import Link from "next/link";

interface DashboardStats {
  total_interviews: number;
  readiness_score: number;
  avg_score: number;
  streak_count: number;
  recent_activity: any[];
}

const defaultStats: DashboardStats = {
  total_interviews: 0,
  readiness_score: 0,
  avg_score: 0,
  streak_count: 0,
  recent_activity: [],
};

/* ── Animated Counter Hook ── */
function useAnimatedValue(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

/* ── Skeleton Components ── */
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

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="skeleton h-8 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="rounded-2xl border border-border bg-card/30 p-6">
        <div className="skeleton h-6 w-40 rounded mb-6" />
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, numericValue, icon, iconBg, delay, trend }: {
  label: string;
  value: string;
  numericValue: number;
  icon: React.ReactNode;
  iconBg: string;
  delay: number;
  trend?: string;
}) {
  const animatedVal = useAnimatedValue(numericValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm
                 hover:border-border/80 hover:bg-card/50 transition-all duration-300
                 hover:shadow-lg cursor-default"
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
           style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)' }} />

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
          {value.includes('/') ? `${animatedVal}/100` : value.includes('%') ? `${animatedVal}%` : value.includes('Days') ? `${animatedVal}` : animatedVal}
        </span>
        {value.includes('Days') && <span className="text-sm text-muted-foreground mb-1">days</span>}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <TrendingUp className="h-3 w-3 text-success" />
          <span className="text-success font-medium">{trend}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Sidebar Navigation ── */
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const router = useRouter();

  const navItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/dashboard", active: true },
    { icon: <BrainCircuit className="h-5 w-5" />, label: "Interviews", href: "/interview/setup", active: false },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", href: "/dashboard", active: false },
    { icon: <TrendingUp className="h-5 w-5" />, label: "Growth", href: "/dashboard", active: false },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", href: "/dashboard", active: false },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen border-r border-border bg-surface z-40"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="h-4 w-4 text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-foreground whitespace-nowrap overflow-hidden"
              >
                Kaizenova
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${item.active
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <span className={`flex-shrink-0 ${item.active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {item.icon}
            </span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
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

/* ── Main Dashboard ── */
export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await api.get("/analytics/dashboard");
        setStats(res.data);
      } catch {
        // Use default zero stats if endpoint fails
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

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
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
              {user.full_name?.charAt(0) ?? "?"}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <nav className="p-3 space-y-1">
                {[
                  { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, href: "/dashboard", active: true },
                  { label: "New Interview", icon: <BrainCircuit className="h-4 w-4" />, href: "/interview/setup", active: false },
                ].map(item => (
                  <button key={item.label} onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
                <button onClick={() => { logout(); router.push("/auth/login"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <motion.main
        id="main-content"
        initial={false}
        animate={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarCollapsed ? 72 : 240) : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen"
      >
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex border-b border-border glass-strong sticky top-0 z-30">
          <div className="flex-1 px-8 h-16 flex items-center justify-between">
            <div />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.full_name}</span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                {user.full_name?.charAt(0) ?? "?"}
              </div>
              <button
                onClick={() => { logout(); router.push("/auth/login"); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              {/* Greeting + CTA */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl sm:text-3xl font-bold text-foreground"
                  >
                    {getGreeting()}, {firstName} 👋
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-muted-foreground mt-1"
                  >
                    Here&apos;s your interview readiness overview.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button onClick={() => router.push("/interview/setup")} className="gap-2 shadow-glow-primary">
                    <PlayCircle className="h-4 w-4" />
                    Start Mock Interview
                  </Button>
                </motion.div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Readiness Score"
                  value={`${stats.readiness_score}/100`}
                  numericValue={stats.readiness_score}
                  icon={<Star className="h-5 w-5 text-yellow-400" />}
                  iconBg="bg-yellow-400/10"
                  delay={0.05}
                />
                <StatCard
                  label="Interviews Completed"
                  value={String(stats.total_interviews)}
                  numericValue={stats.total_interviews}
                  icon={<Activity className="h-5 w-5 text-primary" />}
                  iconBg="bg-primary/10"
                  delay={0.1}
                />
                <StatCard
                  label="Avg. Performance"
                  value={`${stats.avg_score}%`}
                  numericValue={stats.avg_score}
                  icon={<Target className="h-5 w-5 text-secondary" />}
                  iconBg="bg-secondary/10"
                  delay={0.15}
                />
                <StatCard
                  label="Current Streak"
                  value={`${stats.streak_count} Days`}
                  numericValue={stats.streak_count}
                  icon={<Flame className="h-5 w-5 text-accent" />}
                  iconBg="bg-accent/10"
                  delay={0.2}
                  trend={stats.streak_count > 0 ? "Active" : undefined}
                />
              </div>

              {/* Quick Actions + AI Coach */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="lg:col-span-1"
                >
                  <div className="rounded-2xl border border-border bg-card/30 p-6 h-full">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push("/interview/setup")}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:border-primary/30 transition-all group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-foreground">Quick Interview</div>
                          <div className="text-xs text-muted-foreground">Start a practice session</div>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-auto" />
                      </button>
                      <button
                        onClick={() => router.push("/interview/setup")}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:border-secondary/30 transition-all group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                          <BarChart3 className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-foreground">View Analytics</div>
                          <div className="text-xs text-muted-foreground">Track your progress</div>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-auto" />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* AI Coach Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2"
                >
                  <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/50 to-secondary/5 p-6 h-full overflow-hidden">
                    {/* Subtle glow */}
                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-secondary/10 blur-[50px] pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
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
                            ? "Welcome to Kaizenova! Start your first mock interview to receive personalized coaching recommendations. I'll analyze your strengths and areas for improvement."
                            : `Great progress! You've completed ${stats.total_interviews} interview${stats.total_interviews !== 1 ? 's' : ''} with an average score of ${stats.avg_score}%. Keep practicing to maintain your ${stats.streak_count}-day streak and push your readiness score higher!`
                          }
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/interview/setup")}
                        className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <BrainCircuit className="h-3.5 w-3.5 mr-1.5" />
                        Start Recommended Session
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Activity */}
              {stats.recent_activity.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                      <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
                      <span className="text-xs text-muted-foreground">{stats.recent_activity.length} sessions</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {stats.recent_activity.map((activity, i) => {
                        const score = activity.score;
                        const scoreColorClass = score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-accent';
                        const scoreBgClass = score >= 75 ? 'bg-success/10' : score >= 50 ? 'bg-warning/10' : 'bg-accent/10';

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
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
                            <div className={`text-sm font-semibold px-3 py-1 rounded-lg ${scoreColorClass} ${scoreBgClass} group-hover:shadow-sm transition-all`}>
                              {score.toFixed(1)}%
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Premium Empty State */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative rounded-2xl border border-dashed border-border bg-card/20 p-12 text-center overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-8 left-1/4 h-20 w-20 rounded-full bg-primary/5 blur-[40px]" />
                    <div className="absolute bottom-8 right-1/4 h-16 w-16 rounded-full bg-secondary/5 blur-[30px]" />
                  </div>

                  <div className="relative z-10">
                    {/* Animated Icon */}
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                      className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-center"
                    >
                      <BrainCircuit className="h-10 w-10 text-primary/60" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-foreground mb-2">Your journey starts here</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8 leading-relaxed">
                      Start your first AI-powered mock interview and see your performance analytics, 
                      readiness scores, and personalized coaching recommendations appear here.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => router.push("/interview/setup")} className="gap-2 shadow-glow-primary">
                        <PlayCircle className="h-4 w-4" />
                        Start Your First Interview
                      </Button>
                    </div>

                    {/* Feature hints */}
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                      {[
                        { icon: <Target className="h-4 w-4 text-primary" />, text: "Adaptive difficulty" },
                        { icon: <BarChart3 className="h-4 w-4 text-secondary" />, text: "Deep analytics" },
                        { icon: <Sparkles className="h-4 w-4 text-warning" />, text: "AI coaching" },
                      ].map((hint, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
                        >
                          {hint.icon}
                          {hint.text}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  );
}
