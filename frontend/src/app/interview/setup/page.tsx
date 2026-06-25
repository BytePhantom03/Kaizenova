"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  BrainCircuit, Code2, Users, Layers, ChevronRight, ArrowLeft,
  Sparkles, Clock, Check
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

const INTERVIEW_TYPES = [
  {
    id: "technical",
    label: "Technical",
    description: "Data structures, algorithms & coding questions",
    icon: <Code2 className="h-6 w-6" />,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/30",
    hoverBorder: "hover:border-primary/50",
    shadow: "hover:shadow-[0_0_20px_rgba(0,240,255,0.08)]",
  },
  {
    id: "behavioral",
    label: "Behavioral",
    description: "Situational & STAR-format questions",
    icon: <Users className="h-6 w-6" />,
    color: "text-secondary",
    bg: "bg-secondary/10 border-secondary/30",
    hoverBorder: "hover:border-secondary/50",
    shadow: "hover:shadow-[0_0_20px_rgba(138,43,226,0.08)]",
  },
  {
    id: "system_design",
    label: "System Design",
    description: "Architecture, scalability & design patterns",
    icon: <Layers className="h-6 w-6" />,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/30",
    hoverBorder: "hover:border-accent/50",
    shadow: "hover:shadow-[0_0_20px_rgba(255,0,85,0.08)]",
  },
];

const DOMAINS = ["Software Engineering", "Data Science", "DevOps", "Frontend", "Backend", "Mobile", "Security", "Product Management"];
const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", desc: "Entry level — 0-2 years", icon: "🌱" },
  { value: "intermediate", label: "Intermediate", desc: "Mid level — 2-5 years", icon: "🚀" },
  { value: "advanced", label: "Advanced", desc: "Senior level — 5+ years", icon: "⚡" },
];

const STEP_LABELS = ["Type", "Details", "Configure"];

const pageTransition = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export default function InterviewSetup() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    interview_type: "",
    target_role: "",
    target_company: "",
    domain: "Software Engineering",
    difficulty_setting: "intermediate",
    duration_minutes: 30,
  });

  React.useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, router]);

  const handleStart = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/interviews/start", {
        interview_type: form.interview_type,
        target_role: form.target_role,
        target_company: form.target_company || null,
        domain: form.domain,
        difficulty_setting: form.difficulty_setting,
        duration_minutes: form.duration_minutes,
      });
      router.push(`/interview/session/${res.data.id}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to start interview. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glows */}
      <div className="fixed top-0 left-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none"
           style={{ animation: 'meshFloat1 20s ease-in-out infinite' }} />
      <div className="fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-secondary/8 blur-[100px] pointer-events-none"
           style={{ animation: 'meshFloat2 25s ease-in-out infinite' }} />

      <header className="border-b border-border glass-strong sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1.5 hover:bg-muted/50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">New Interview</span>
          </div>

          {/* Step progress bar */}
          <div className="ml-auto flex items-center gap-3">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;

              return (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`hidden sm:block h-px w-6 transition-colors duration-300 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                      isComplete ? 'bg-primary text-primary-foreground' :
                      isActive ? 'bg-primary/20 text-primary border border-primary/40' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNum}
                    </div>
                    <span className={`hidden sm:inline text-xs font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-12 relative z-10">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl border border-accent/30 bg-accent/10 text-accent text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Step 1 — Interview type */}
          {step === 1 && (
            <motion.div key="step1" {...pageTransition}>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Choose Interview Type</h1>
              <p className="text-muted-foreground mb-8">Select the type of interview you want to practice.</p>
              <div className="grid gap-4">
                {INTERVIEW_TYPES.map((type) => (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => { setForm({ ...form, interview_type: type.id }); setStep(2); }}
                    className={`flex items-center gap-5 p-6 rounded-2xl border text-left transition-all duration-300 ${type.shadow} ${
                      form.interview_type === type.id
                        ? `${type.bg} border-opacity-100`
                        : `border-border bg-card/30 ${type.hoverBorder} hover:bg-card/50`
                    }`}
                  >
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${type.bg} ${type.color} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-lg ${type.color}`}>{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Role & Domain */}
          {step === 2 && (
            <motion.div key="step2" {...pageTransition}>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Tell us about the role</h1>
              <p className="text-muted-foreground mb-8">This helps us tailor questions to your target position.</p>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Target Role *</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={form.target_role}
                    onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3),0_0_12px_rgba(0,240,255,0.1)]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Company (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Amazon, Startup..."
                    value={form.target_company}
                    onChange={(e) => setForm({ ...form, target_company: e.target.value })}
                    className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3),0_0_12px_rgba(0,240,255,0.1)]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">Domain</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DOMAINS.map((d) => (
                      <motion.button
                        key={d}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setForm({ ...form, domain: d })}
                        className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                          form.domain === d
                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(0,240,255,0.1)]"
                            : "border-border bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-card/50"
                        }`}
                      >
                        {d}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!form.target_role.trim()}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Difficulty & Duration */}
          {step === 3 && (
            <motion.div key="step3" {...pageTransition}>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Set your challenge level</h1>
              <p className="text-muted-foreground mb-8">Pick the difficulty and how long you want to practice.</p>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">Difficulty</label>
                  <div className="grid gap-3">
                    {DIFFICULTIES.map((d) => (
                      <motion.button
                        key={d.value}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setForm({ ...form, difficulty_setting: d.value })}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          form.difficulty_setting === d.value
                            ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(0,240,255,0.08)]"
                            : "border-border bg-card/30 hover:border-primary/30 hover:bg-card/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-xl">{d.icon}</span>
                          <div>
                            <div className={`font-semibold ${form.difficulty_setting === d.value ? "text-primary" : "text-foreground"}`}>
                              {d.label}
                            </div>
                            <div className="text-xs text-muted-foreground">{d.desc}</div>
                          </div>
                        </div>
                        {form.difficulty_setting === d.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    Duration: <span className="text-primary font-bold">{form.duration_minutes} minutes</span>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min={15}
                      max={60}
                      step={15}
                      value={form.duration_minutes}
                      onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    {[15, 30, 45, 60].map(v => (
                      <button
                        key={v}
                        onClick={() => setForm({ ...form, duration_minutes: v })}
                        className={`px-2 py-0.5 rounded transition-colors ${form.duration_minutes === v ? 'text-primary font-medium' : 'hover:text-foreground'}`}
                      >
                        {v} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary card */}
                <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interview Summary</span>
                  </div>
                  {[
                    ["Type", form.interview_type],
                    ["Role", form.target_role],
                    ...(form.target_company ? [["Company", form.target_company]] : []),
                    ["Domain", form.domain],
                    ["Difficulty", form.difficulty_setting],
                    ["Duration", `${form.duration_minutes} min`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={handleStart} loading={isLoading} disabled={isLoading} className="flex-1 gap-2">
                    {isLoading ? "Starting..." : (
                      <><BrainCircuit className="h-4 w-4" /> Begin Interview</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
