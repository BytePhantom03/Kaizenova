"use client";
/**
 * PracticeSession — Reusable interactive session UI component.
 *
 * Used by: Speaking, Fluency, IELTS, Grammar, Vocabulary trainer pages.
 * Handles the full session lifecycle:
 *   start → prompt display → user input → evaluation → next prompt → report.
 *
 * Props drive all trainer-specific differences (title, icon, config).
 * No trainer-specific logic lives in this component.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import AIAvatar from "@/components/interview/AIAvatar";
import {
  ChevronRight, ArrowLeft, Sparkles, Mic, MicOff,
  CheckCircle2, AlertCircle, TrendingUp, Star, RotateCcw,
  Volume2, Loader2
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
export interface SessionConfig {
  trainer_type: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  topic?: string;
  sub_mode?: string;
  extra_config?: Record<string, unknown>;
  input_label?: string;
  input_placeholder?: string;
  /** Number of rows in the textarea */
  input_rows?: number;
}

interface TurnEvaluation {
  grammar_score?: number;
  fluency_score?: number;
  vocabulary_score?: number;
  confidence_score?: number;
  coherence_score?: number;
  composite_score?: number;
  band_score?: number;
  is_correct?: boolean;
  accuracy_score?: number;
  mistakes?: string[];
  suggestions?: string[];
  ai_feedback?: string;
  corrected_version?: string;
  improved_version?: string;
  explanation?: string;
  model_answer?: string;
  errors?: Array<{ original: string; correction: string; rule: string }>;
  example_sentences?: string[];
}

interface SessionReport {
  overall_score: number;
  dimension_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  ai_feedback: string;
  suggestions: string[];
  improvement_roadmap: string[];
  turns_count: number;
}

type Phase = "idle" | "active" | "evaluating" | "report";

// ── Score pill ─────────────────────────────────────────────────────────────
function ScorePill({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined || value === null) return null;
  const color = value >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : value >= 55 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center ${color}`}>
      <span className="text-lg font-bold tabular-nums">{value.toFixed(0)}</span>
      <span className="text-[10px] font-medium mt-0.5 opacity-80">{label}</span>
    </div>
  );
}

// ── Evaluation panel ───────────────────────────────────────────────────────
function EvaluationPanel({ evaluation, trainerType }: { evaluation: TurnEvaluation; trainerType: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/40 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Evaluation</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Score pills */}
        <div className="flex flex-wrap gap-2">
          {trainerType === "ielts" && evaluation.band_score !== undefined && (
            <div className="flex flex-col items-center px-4 py-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-center">
              <span className="text-2xl font-bold">{evaluation.band_score}</span>
              <span className="text-[10px] font-medium">Band Score</span>
            </div>
          )}
          {trainerType === "grammar" && evaluation.is_correct !== undefined && (
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold ${evaluation.is_correct ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
              {evaluation.is_correct ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {evaluation.is_correct ? "Correct!" : "Needs correction"}
            </div>
          )}
          <ScorePill label="Grammar" value={evaluation.grammar_score} />
          <ScorePill label="Fluency" value={evaluation.fluency_score} />
          <ScorePill label="Vocabulary" value={evaluation.vocabulary_score} />
          <ScorePill label="Confidence" value={evaluation.confidence_score} />
          <ScorePill label="Coherence" value={evaluation.coherence_score} />
          {evaluation.accuracy_score !== undefined && (
            <ScorePill label="Accuracy" value={evaluation.accuracy_score} />
          )}
        </div>

        {/* AI Feedback */}
        {evaluation.ai_feedback && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-foreground leading-relaxed">{evaluation.ai_feedback}</p>
          </div>
        )}

        {/* Explanation (grammar) */}
        {evaluation.explanation && (
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{evaluation.explanation}</p>
          </div>
        )}

        {/* Corrected version */}
        {(evaluation.corrected_version || evaluation.improved_version) && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[11px] text-emerald-400 font-semibold mb-1">Improved version</p>
            <p className="text-xs text-foreground leading-relaxed italic">
              "{evaluation.corrected_version || evaluation.improved_version}"
            </p>
          </div>
        )}

        {/* Model answer (IELTS) */}
        {evaluation.model_answer && (
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3">
            <p className="text-[11px] text-yellow-400 font-semibold mb-1">Band 8–9 Model Answer</p>
            <p className="text-xs text-foreground leading-relaxed italic">"{evaluation.model_answer}"</p>
          </div>
        )}

        {/* Example sentences (vocabulary) */}
        {evaluation.example_sentences && evaluation.example_sentences.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground">Example sentences:</p>
            {evaluation.example_sentences.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground italic pl-3 border-l border-primary/30">
                {s}
              </p>
            ))}
          </div>
        )}

        {/* Mistakes */}
        {evaluation.mistakes && evaluation.mistakes.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-red-400">Issues detected:</p>
            {evaluation.mistakes.map((m, i) => (
              <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-red-400 flex-shrink-0">•</span>{m}
              </p>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {evaluation.suggestions && evaluation.suggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-primary">Suggestions:</p>
            {evaluation.suggestions.slice(0, 3).map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-primary flex-shrink-0">→</span>{s}
              </p>
            ))}
          </div>
        )}

        {/* Grammar errors detail */}
        {evaluation.errors && evaluation.errors.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-red-400">Grammar errors:</p>
            {evaluation.errors.slice(0, 3).map((e, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface/50 p-2 text-xs">
                <span className="line-through text-red-400/80">{e.original}</span>
                <span className="text-muted-foreground mx-1">→</span>
                <span className="text-emerald-400">{e.correction}</span>
                {e.rule && <span className="text-muted-foreground/60 ml-1">({e.rule})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Session report ─────────────────────────────────────────────────────────
function SessionReportPanel({ report, onRestart, trainerType }: {
  report: SessionReport;
  onRestart: () => void;
  trainerType: string;
}) {
  const router = useRouter();
  const scoreColor = report.overall_score >= 75 ? "text-emerald-400"
    : report.overall_score >= 55 ? "text-yellow-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Overall score */}
      <div className="rounded-2xl border border-border bg-card/40 p-6 text-center">
        <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>
          {report.overall_score.toFixed(0)}
        </div>
        <p className="text-sm text-muted-foreground">Session Score</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{report.turns_count} turns completed</p>
      </div>

      {/* Dimension scores */}
      {Object.keys(report.dimension_scores).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(report.dimension_scores)
            .filter(([k]) => k.endsWith("_score") && !k.startsWith("composite"))
            .map(([k, v]) => (
              <ScorePill key={k} label={k.replace("_score", "").replace("_", " ")} value={v} />
            ))}
        </div>
      )}

      {/* AI Feedback */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Coach Feedback</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{report.ai_feedback}</p>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {report.strengths.length > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-2">✓ Strengths</p>
            {report.strengths.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground flex gap-1.5 mb-1">
                <span className="text-emerald-400">•</span>{s}
              </p>
            ))}
          </div>
        )}
        {report.weaknesses.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs font-semibold text-red-400 mb-2">✗ Areas to Improve</p>
            {report.weaknesses.map((w, i) => (
              <p key={i} className="text-xs text-muted-foreground flex gap-1.5 mb-1">
                <span className="text-red-400">•</span>{w}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Roadmap */}
      {report.improvement_roadmap.length > 0 && (
        <div className="rounded-xl border border-border bg-card/30 p-4">
          <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Improvement Roadmap
          </p>
          <div className="space-y-2">
            {report.improvement_roadmap.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</div>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {report.suggestions.length > 0 && (
        <div className="rounded-xl border border-border bg-card/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground mb-1">Next Steps</p>
          {report.suggestions.map((s, i) => (
            <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-primary">→</span>{s}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card/30 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <RotateCcw className="h-4 w-4" /> Practice Again
        </button>
        <button
          onClick={() => router.push("/skills")}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary hover:bg-primary hover:text-background transition-all"
        >
          All Trainers <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main PracticeSession component ─────────────────────────────────────────
export default function PracticeSession({ config }: { config: SessionConfig }) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [userInput, setUserInput] = useState("");
  const [turnsCompleted, setTurnsCompleted] = useState(0);
  const [maxTurns, setMaxTurns] = useState(5);
  const [lastEvaluation, setLastEvaluation] = useState<TurnEvaluation | null>(null);
  const [report, setReport] = useState<SessionReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // TTS — speak the current prompt
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); inputRef.current?.focus(); };
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // STT — Web Speech API microphone
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setUserInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, []);

  const startSession = async () => {
    setIsStarting(true);
    setErrorMsg(null);
    setLastEvaluation(null);
    setUserInput("");
    setTurnsCompleted(0);
    try {
      const res = await api.post("/skills/sessions/start", {
        trainer_type: config.trainer_type,
        topic: config.topic || null,
        sub_mode: config.sub_mode || null,
        session_config: config.extra_config || {},
      });
      setSessionId(res.data.session_id);
      setCurrentPrompt(res.data.first_prompt);
      setMaxTurns(res.data.max_turns || 5);
      setPhase("active");
      speak(res.data.first_prompt);
    } catch {
      setErrorMsg("Could not start session. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const submitResponse = async () => {
    if (!sessionId || !userInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setPhase("evaluating");
    setErrorMsg(null);
    try {
      const res = await api.post(`/skills/sessions/${sessionId}/respond`, {
        user_response: userInput.trim(),
      });
      const data = res.data;
      setLastEvaluation(data.evaluation);
      setTurnsCompleted(data.turns_completed || turnsCompleted + 1);
      setUserInput("");

      if (data.is_session_complete) {
        await completeSession();
      } else {
        setCurrentPrompt(data.next_prompt || "");
        setPhase("active");
        if (data.next_prompt) speak(data.next_prompt);
      }
    } catch {
      setErrorMsg("Evaluation failed. Please try again.");
      setPhase("active");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;
    setIsCompleting(true);
    setPhase("evaluating");
    try {
      const res = await api.post(`/skills/sessions/${sessionId}/complete`);
      setReport(res.data);
      setPhase("report");
    } catch {
      setErrorMsg("Could not generate report.");
      setPhase("active");
    } finally {
      setIsCompleting(false);
    }
  };

  const restart = () => {
    window.speechSynthesis?.cancel();
    setPhase("idle");
    setSessionId(null);
    setCurrentPrompt("");
    setUserInput("");
    setLastEvaluation(null);
    setReport(null);
    setTurnsCompleted(0);
    setErrorMsg(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isSubmitting) {
      e.preventDefault();
      submitResponse();
    }
  };

  const progressPct = maxTurns > 0 ? (turnsCompleted / maxTurns) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { window.speechSynthesis?.cancel(); router.push("/skills"); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Trainers
          </button>
          <div className="flex items-center gap-2">
            {config.icon}
            <span className="text-sm font-semibold text-foreground">{config.title}</span>
          </div>
        </div>

        {/* Progress bar */}
        {phase === "active" && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Turn {turnsCompleted + 1} of {maxTurns}</span>
              <span>{turnsCompleted} completed</span>
            </div>
            <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-16 space-y-6"
            >
              <div className="flex justify-center">
                <AIAvatar isSpeaking={false} isListening={false} isThinking={false} size={160} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{config.title}</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">{config.subtitle}</p>
              </div>
              {errorMsg && (
                <p className="text-sm text-red-400 flex items-center gap-1.5 justify-center">
                  <AlertCircle className="h-4 w-4" /> {errorMsg}
                </p>
              )}
              <button
                onClick={startSession}
                disabled={isStarting}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-background font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isStarting ? "Starting..." : "Start Session"}
              </button>
            </motion.div>
          )}

          {/* ── ACTIVE ── */}
          {phase === "active" && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Avatar + Prompt */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 flex justify-center w-full sm:w-auto">
                  <AIAvatar isSpeaking={isSpeaking} isListening={isListening} isThinking={false} size={130} />
                </div>
                <div className="flex-1">
                  {/* Prompt */}
                  <div className="relative rounded-2xl border border-border bg-card/30 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary" />
                    <div className="p-5 pl-6">
                      <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">
                        {currentPrompt}
                      </p>
                    </div>
                    <button
                      onClick={() => speak(currentPrompt)}
                      className="absolute top-3 right-3 h-7 w-7 rounded-lg border border-border bg-surface hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Last evaluation (collapsed preview) */}
              {lastEvaluation && (
                <EvaluationPanel evaluation={lastEvaluation} trainerType={config.trainer_type} />
              )}

              {/* User input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    {config.input_label || "Your Response"}
                  </label>
                  <span className="text-xs tabular-nums text-muted-foreground/60">
                    {userInput.length} chars
                  </span>
                </div>
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={config.input_placeholder || "Type your response here..."}
                  rows={config.input_rows || 5}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none leading-relaxed disabled:opacity-50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 items-center">
                <button
                  onClick={startListening}
                  disabled={isListening || isSubmitting}
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${
                    isListening
                      ? "border-red-400/50 bg-red-400/10 text-red-400 animate-pulse"
                      : "border-border bg-surface text-muted-foreground hover:text-primary hover:border-primary/30"
                  }`}
                  title="Click to speak"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => completeSession()}
                  disabled={isSubmitting || isCompleting}
                  className="px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  End Session
                </button>
                <button
                  onClick={submitResponse}
                  disabled={!userInput.trim() || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40"
                >
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating...</>
                    : <>Submit <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />{errorMsg}
                </p>
              )}

              <p className="text-center text-xs text-muted-foreground/50">
                Press <kbd className="px-1 py-0.5 rounded border border-border text-[10px]">Enter</kbd> to submit
                {" · "}click <Mic className="h-2.5 w-2.5 inline" /> to speak
              </p>
            </motion.div>
          )}

          {/* ── EVALUATING ── */}
          {phase === "evaluating" && (
            <motion.div key="eval" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-6"
            >
              <AIAvatar isSpeaking={false} isListening={false} isThinking={true} size={140} />
              <p className="text-sm text-muted-foreground animate-pulse">
                {isCompleting ? "Generating your session report..." : "AI is evaluating your response..."}
              </p>
            </motion.div>
          )}

          {/* ── REPORT ── */}
          {phase === "report" && report && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SessionReportPanel
                report={report}
                onRestart={restart}
                trainerType={config.trainer_type}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
