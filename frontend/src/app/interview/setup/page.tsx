"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  BrainCircuit, Code2, Users, Layers, ChevronRight, ArrowLeft,
  Sparkles, Clock, Check, UploadCloud, FileText, X, CheckCircle2
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

const DURATION_TICKS = [15, 30, 45, 60];

const pageTransition = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

function InterviewSetupInner() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
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
    resume_id: null as string | null,
  });

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeStatus, setResumeStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const resumeInputRef = React.useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, _hasHydrated, router]);

  // Pre-fill from recommendation OR resume query params
  useEffect(() => {
    const recommended = searchParams.get("recommended");
    const domain = searchParams.get("domain");
    const type = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");
    const role = searchParams.get("role");
    const resumeId = searchParams.get("resume_id");

    if (resumeId) {
      // Coming from the dashboard resume upload — skip to step 3 with pre-filled data
      setForm(f => ({
        ...f,
        resume_id: resumeId,
        ...(difficulty ? { difficulty_setting: difficulty } : {}),
        ...(role ? { target_role: role } : {}),
      }));
      setStep(3);
    } else if (recommended === "true") {
      setForm(f => ({
        ...f,
        domain: domain || f.domain,
        interview_type: type || f.interview_type,
        difficulty_setting: difficulty || f.difficulty_setting,
        target_role: role || f.target_role,
      }));
      // Skip to final step since everything is pre-configured
      setStep(3);
    }
  }, [searchParams]);


  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowed.includes(file.type)) {
      setResumeStatus("error");
      return;
    }
    setResumeFile(file);
    setResumeStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm(f => ({ ...f, resume_id: res.data.resume_id }));
      setResumeStatus("done");
    } catch {
      setResumeStatus("error");
    }
  };

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
        resume_id: form.resume_id || null,
      });
      router.push(`/interview/session/${res.data.id}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to start interview. Please try again.");
      setIsLoading(false);
    }
  };

  /* ---------- Progress bar width fraction ---------- */
  const progressFraction = (step - 1) / (STEP_LABELS.length - 1);

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

          {/* ── Connected Step Progress Bar ── */}
          <div className="ml-auto flex items-center">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;

              return (
                <React.Fragment key={i}>
                  {/* Connector line between steps */}
                  {i > 0 && (
                    <div className="hidden sm:block relative h-[3px] w-10 mx-0.5 rounded-full overflow-hidden bg-border">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                        }}
                        initial={false}
                        animate={{ width: isComplete || isActive ? '100%' : '0%' }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  )}

                  {/* Step circle + label */}
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className={`relative h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                        isComplete
                          ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : isActive
                            ? 'bg-primary/20 text-primary border-2 border-primary/60 breathe-glow'
                            : 'bg-muted text-muted-foreground border border-border'
                      }`}
                      initial={false}
                      animate={isComplete ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                      {isComplete ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        stepNum
                      )}
                    </motion.div>
                    <span className={`hidden sm:inline text-xs font-medium transition-colors duration-200 ${
                      isActive ? 'text-foreground' : isComplete ? 'text-primary/70' : 'text-muted-foreground'
                    }`}>
                      {label}
                    </span>
                  </div>
                </React.Fragment>
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

        {searchParams.get("recommended") === "true" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3"
          >
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-primary">AI-Recommended Session</div>
              <div className="text-xs text-muted-foreground">
                This session has been pre-configured based on your weak areas. You can adjust settings below before starting.
              </div>
            </div>
          </motion.div>
        )}

        {searchParams.get("resume_id") && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-400">Resume Interview Ready</div>
              <div className="text-xs text-muted-foreground">
                Your resume is attached. The AI will ask questions tailored to your actual projects and tech stack.
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1 — Interview type */}
          {step === 1 && (
            <motion.div key="step1" {...pageTransition}>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Choose Interview Type</h1>
              <p className="text-muted-foreground mb-8">Select the type of interview you want to practice.</p>
              <div className="grid gap-4">
                {INTERVIEW_TYPES.map((type) => {
                  const isSelected = form.interview_type === type.id;
                  return (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() => { setForm({ ...form, interview_type: type.id }); setStep(2); }}
                      className={`relative flex items-center gap-5 p-6 rounded-2xl border text-left transition-all duration-300 ${type.shadow} ${
                        isSelected
                          ? `${type.bg} border-opacity-100`
                          : `border-border bg-card/30 ${type.hoverBorder} hover:bg-card/50`
                      }`}
                    >
                      {/* Gradient border glow when selected */}
                      {isSelected && (
                        <span
                          className="pointer-events-none absolute inset-0 rounded-2xl gradient-border-animated opacity-60"
                          style={{
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                            padding: '1.5px',
                          }}
                          aria-hidden
                        />
                      )}
                      {/* Subtle glow backdrop when selected */}
                      {isSelected && (
                        <span
                          className="pointer-events-none absolute inset-0 rounded-2xl"
                          style={{
                            boxShadow: '0 0 28px rgba(0,240,255,0.12), inset 0 0 28px rgba(0,240,255,0.04)',
                          }}
                          aria-hidden
                        />
                      )}
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${type.bg} ${type.color} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-lg ${type.color}`}>{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </motion.button>
                  );
                })}
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

                {/* ── Duration slider with tick marks ── */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    Duration: <span className="text-primary font-bold">{form.duration_minutes} minutes</span>
                  </label>

                  {/* Tick marks above slider */}
                  <div className="relative w-full h-5 mb-1">
                    {DURATION_TICKS.map((v) => {
                      const pct = ((v - 15) / (60 - 15)) * 100;
                      const isCurrentOrPast = form.duration_minutes >= v;
                      return (
                        <div
                          key={v}
                          className="absolute flex flex-col items-center -translate-x-1/2"
                          style={{ left: `${pct}%` }}
                        >
                          <span className={`text-[10px] font-medium tabular-nums transition-colors duration-200 ${
                            form.duration_minutes === v ? 'text-primary' : 'text-muted-foreground/60'
                          }`}>
                            {v}
                          </span>
                          <span className={`mt-0.5 h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                            isCurrentOrPast ? 'bg-primary shadow-[0_0_4px_rgba(0,240,255,0.4)]' : 'bg-border'
                          }`} />
                        </div>
                      );
                    })}
                  </div>

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
                    {DURATION_TICKS.map(v => (
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

                {/* ── Resume Upload ── */}
                <div
                  className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
                    ${ isDragging ? "border-primary bg-primary/10 scale-[1.01]" :
                       resumeStatus === "done" ? "border-emerald-500/50 bg-emerald-500/5" :
                       resumeStatus === "error" ? "border-red-500/40 bg-red-500/5" :
                       "border-border/60 bg-card/20 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleResumeUpload(f);
                  }}
                >
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }}
                  />

                  {resumeStatus === "idle" || resumeStatus === "error" ? (
                    <button
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      className="w-full flex flex-col items-center gap-3 p-8 text-center cursor-pointer"
                    >
                      <div className="h-14 w-14 rounded-2xl border border-border/60 bg-card/50 flex items-center justify-center">
                        <UploadCloud className={`h-7 w-7 ${resumeStatus === "error" ? "text-red-400" : "text-primary"}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {resumeStatus === "error" ? "Upload failed — try again" : "Upload Your Resume"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Drag & drop or click to browse &bull; PDF, DOCX, TXT
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Questions will be tailored to your projects & tech stack
                        </p>
                      </div>
                      <span className="px-4 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                        Choose file
                      </span>
                    </button>
                  ) : resumeStatus === "uploading" ? (
                    <div className="flex items-center gap-4 p-6">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{resumeFile?.name}</p>
                        <div className="mt-2 h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                            initial={{ width: "0%" }}
                            animate={{ width: "85%" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Parsing resume...</p>
                      </div>
                    </div>
                  ) : (
                    /* Done state */
                    <div className="flex items-center gap-4 p-6">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-400">Resume ready!</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{resumeFile?.name}</p>
                      </div>
                      <button
                        onClick={() => { setResumeFile(null); setResumeStatus("idle"); setForm(f => ({ ...f, resume_id: null })); }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
                        title="Remove resume"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Summary card ── */}
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
                    ["Resume", resumeStatus === "done" ? resumeFile?.name ?? "Attached" : "Not uploaded (optional)"],
                  ].map(([label, value], i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.05,
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`font-medium capitalize ${label === "Resume" && resumeStatus === "done" ? "text-emerald-400" : "text-foreground"}`}>
                        {value}
                      </span>
                    </motion.div>
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

export default function InterviewSetup() {
  return (
    <Suspense>
      <InterviewSetupInner />
    </Suspense>
  );
}
