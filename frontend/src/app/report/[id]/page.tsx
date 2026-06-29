"use client";
import React, { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BrainCircuit, ArrowLeft, TrendingUp, CheckCircle2, AlertCircle, Target, Share2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface ReportData {
  id: string;
  interview_id: string;
  overall_score: number;
  technical_avg: number | null;
  communication_avg: number | null;
  confidence_avg: number | null;
  completeness_avg: number | null;
  grammar_avg: number | null;
  topic_scores: Record<string, number> | null;
  difficulty_journey: any[] | null;
  weak_areas: string[];
  strong_areas: string[];
  created_at: string;
}

/* ── Score Ring SVG ── */
function ScoreRing({ score, size = 160, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          {score.toFixed(0)}
        </motion.span>
        <span className="text-sm text-muted-foreground mt-1">Overall Score</span>
      </div>
    </div>
  );
}

/* ── Loading Skeleton ── */
function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient background */}
      <div className="fixed top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      {/* Skeleton Header */}
      <header className="border-b border-border glass-strong sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="skeleton h-8 w-32 rounded-lg" />
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 relative z-10 space-y-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-3 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-3 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>

        {/* Top Section: Score Ring + Date */}
        <div className="rounded-3xl border border-border bg-card/30 backdrop-blur-sm p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="skeleton h-10 w-80 rounded-lg" />
            <div className="skeleton h-5 w-56 rounded-lg" />
          </div>
          {/* Score ring skeleton */}
          <div className="flex-shrink-0 relative" style={{ width: 160, height: 160 }}>
            <div className="skeleton h-full w-full rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dimensions skeleton */}
          <div className="rounded-3xl border border-border bg-card/30 p-8 space-y-6">
            <div className="skeleton h-6 w-56 rounded-lg" />
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="skeleton h-3 rounded" style={{ width: `${80 + i * 10}px` }} />
                    <div className="skeleton h-3 w-8 rounded" />
                  </div>
                  <div className="skeleton h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="space-y-8">
            {/* Topic skeleton */}
            <div className="rounded-3xl border border-border bg-card/30 p-8 space-y-6">
              <div className="skeleton h-6 w-40 rounded-lg" />
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="skeleton h-3 rounded" style={{ width: `${60 + i * 15}px` }} />
                      <div className="skeleton h-3 w-8 rounded" />
                    </div>
                    <div className="skeleton h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths / Weaknesses skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/30 bg-card/20 p-6 space-y-4">
                <div className="skeleton h-5 w-28 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-5/6 rounded" />
              </div>
              <div className="rounded-2xl border border-border/30 bg-card/20 p-6 space-y-4">
                <div className="skeleton h-5 w-36 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Journey skeleton */}
        <div className="rounded-3xl border border-border bg-card/30 p-8 space-y-6">
          <div className="skeleton h-6 w-48 rounded-lg" />
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2">
                  <div className="skeleton h-3 w-10 rounded" />
                  <div className="skeleton h-12 w-12 rounded-full" />
                </div>
                {i < 5 && <div className="skeleton flex-1 min-w-[40px] h-0.5 mx-2 mt-6 rounded" />}
              </React.Fragment>
            ))}
          </div>
          <div className="skeleton h-3 w-96 mx-auto rounded" />
        </div>
      </main>
    </div>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = use(params);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    
    const fetchReport = async () => {
      try {
        const res = await api.get(`/analytics/reports/${reportId}`);
        setReport(res.data);
      } catch (e: any) {
        setErrorMsg("Failed to load interview report.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [isAuthenticated, reportId, router]);

  const handleShareReport = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Report link copied to clipboard!", "success");
    } catch {
      toast("Failed to copy link.", "error");
    }
  };

  if (loading) {
    return <ReportSkeleton />;
  }

  if (errorMsg || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-danger mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
          <p className="text-muted-foreground">{errorMsg}</p>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const dimensions = [
    { label: "Technical Accuracy", value: report.technical_avg },
    { label: "Communication", value: report.communication_avg },
    { label: "Completeness", value: report.completeness_avg },
    { label: "Grammar & Syntax", value: report.grammar_avg },
    { label: "Confidence (Vocal)", value: report.confidence_avg },
  ].filter(d => d.value !== null) as { label: string, value: number }[];

  const getVariant = (val: number) => val >= 75 ? "success" : val >= 50 ? "warning" : "danger";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient background */}
      <div className="fixed top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border glass-strong sticky top-0 z-50 no-print">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <BrainCircuit className="h-5 w-5 text-primary" /> Analytical Report
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShareReport} className="gap-2">
              <Share2 className="h-4 w-4" /> Share Report
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 relative z-10 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground no-print" aria-label="Breadcrumb">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span>Reports</span>
          <span>/</span>
          <span className="text-foreground font-medium">Report #{reportId.slice(0, 8)}</span>
        </nav>

        {/* Top Section: Overall Score & Date */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8 items-center justify-between rounded-3xl border border-border bg-card/30 backdrop-blur-sm p-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Interview Evaluation</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Completed on {new Date(report.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          <div className="flex-shrink-0">
            <ScoreRing score={report.overall_score} />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Dimensions Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border bg-card/30 p-8 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-secondary" /> Performance by Dimension</h2>
            <div className="space-y-5">
              {dimensions.map((dim, i) => (
                <motion.div
                  key={dim.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProgressBar
                    value={dim.value}
                    label={dim.label}
                    showLabel
                    variant={getVariant(dim.value)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Topic Breakdown & Strengths/Weaknesses */}
          <div className="space-y-8">
            
            {/* Topic Breakdown */}
            {report.topic_scores && Object.keys(report.topic_scores).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border bg-card/30 p-8 space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Topic Analysis</h2>
                <div className="space-y-5">
                  {Object.entries(report.topic_scores).map(([topic, score]) => (
                    <ProgressBar
                      key={topic}
                      value={score}
                      label={topic}
                      showLabel
                      variant={getVariant(score)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Strengths & Areas to Improve */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="rounded-2xl border border-success/20 bg-success/5 p-6">
                <h3 className="font-semibold text-success mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Strong Areas
                </h3>
                {report.strong_areas.length > 0 ? (
                  <ul className="space-y-2">
                    {report.strong_areas.map(area => (
                      <li key={area} className="text-sm text-success/90">• {area}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-success/70">Keep practicing to build your strengths.</p>
                )}
              </div>

              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6">
                <h3 className="font-semibold text-warning mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Areas to Improve
                </h3>
                {report.weak_areas.length > 0 ? (
                  <ul className="space-y-2">
                    {report.weak_areas.map(area => (
                      <li key={area} className="text-sm text-warning/90">• {area}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-warning/70">No specific weak areas detected!</p>
                )}
              </div>

            </motion.div>

          </div>
        </div>

        {/* Difficulty Journey */}
        {report.difficulty_journey && report.difficulty_journey.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-3xl border border-border bg-card/30 p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" /> Difficulty Journey</h2>
            <div className="flex items-center gap-0 overflow-x-auto pb-4">
              {report.difficulty_journey.map((step, idx) => (
                <React.Fragment key={idx}>
                  <motion.div
                    className="flex flex-col items-center flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <span className="text-xs text-muted-foreground mb-2 whitespace-nowrap">
                      {idx === 0 ? "Start" : `Q${step.question_num}`}
                    </span>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold border-2 relative z-10
                      ${step.to >= 8 ? 'bg-danger/10 border-danger/30 text-danger' : 
                        step.to >= 5 ? 'bg-warning/10 border-warning/30 text-warning' : 
                        'bg-success/10 border-success/30 text-success'}`}
                    >
                      {step.to.toFixed(1)}
                    </div>
                  </motion.div>
                  {idx < report.difficulty_journey!.length - 1 && (
                    <div className="flex-1 min-w-[40px] h-0.5 flow-line mx-0 mt-6 relative" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Difficulty level on a scale from 1 (Beginner) to 10 (Expert). The AI adapts this dynamically based on your real-time performance.
            </p>
          </motion.div>
        )}

      </main>
    </div>
  );
}
