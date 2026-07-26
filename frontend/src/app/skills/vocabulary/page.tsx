"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import {
  BookOpen, ArrowLeft, Plus, ChevronRight, CheckCircle2,
  XCircle, Sparkles, RotateCcw, Clock, Star, Loader2,
  AlertCircle, TrendingUp
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface VocabItem {
  id: string;
  word: string;
  definition: string;
  example_sentence: string;
  difficulty: string;
  mastery_level: number;
  review_count: number;
  next_review_at: string | null;
  context_tags: string[] | null;
  created_at: string;
}

type Mode = "library" | "quiz" | "review";

// ── Mastery indicator ─────────────────────────────────────────────────────
function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < level ? "bg-primary" : "bg-border"}`} />
      ))}
    </div>
  );
}

// ── Difficulty badge ──────────────────────────────────────────────────────
function DiffBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium border ${styles[level] || ""}`}>
      {level}
    </span>
  );
}

// ── Flashcard component ───────────────────────────────────────────────────
function Flashcard({
  item, onResult,
}: { item: VocabItem; onResult: (remembered: boolean) => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <motion.div
        className="relative cursor-pointer h-56"
        onClick={() => setFlipped(f => !f)}
      >
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div key="front"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl border border-primary/30 bg-card/40 flex flex-col items-center justify-center p-8 gap-3 text-center"
            >
              <div className="text-3xl font-bold text-foreground">{item.word}</div>
              <DiffBadge level={item.difficulty} />
              {item.context_tags && item.context_tags.length > 0 && (
                <div className="flex gap-1 flex-wrap justify-center">
                  {item.context_tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-border/50 text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground/60 mt-2">Tap to reveal definition</p>
            </motion.div>
          ) : (
            <motion.div key="back"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center p-6 gap-3 text-center"
            >
              <p className="text-sm font-medium text-foreground leading-relaxed">{item.definition}</p>
              {item.example_sentence && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-3 text-left">
                  "{item.example_sentence}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Reveal CTA */}
      {!flipped && (
        <p className="text-center text-xs text-muted-foreground/50 mt-2">Click card to flip</p>
      )}

      {/* Review buttons — only shown after flip */}
      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 mt-4"
        >
          <button
            onClick={() => { setFlipped(false); onResult(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-400/30 bg-red-400/10 text-red-400 text-sm font-semibold hover:bg-red-400/20 transition-all"
          >
            <XCircle className="h-4 w-4" /> Forgot
          </button>
          <button
            onClick={() => { setFlipped(false); onResult(true); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-400/20 transition-all"
          >
            <CheckCircle2 className="h-4 w-4" /> Got It!
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function VocabularyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("library");
  const [items, setItems] = useState<VocabItem[]>([]);
  const [dueItems, setDueItems] = useState<VocabItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [libRes, dueRes] = await Promise.all([
        api.get("/skills/vocabulary?limit=50"),
        api.get("/skills/vocabulary/due"),
      ]);
      setItems(libRes.data);
      setDueItems(dueRes.data);
    } catch {
      setErrorMsg("Could not load vocabulary list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const generateWord = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      await api.post(`/skills/vocabulary/generate?difficulty=${difficulty}`);
      await loadData();
    } catch {
      setErrorMsg("Could not generate word. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (itemId: string, remembered: boolean) => {
    setReviewingId(itemId);
    try {
      await api.post(`/skills/vocabulary/${itemId}/review`, { remembered });
      const current = quizIdx;
      if (current + 1 >= dueItems.length) {
        setQuizResult({ correct: 0, total: dueItems.length });
        setMode("library");
        await loadData();
      } else {
        setQuizIdx(current + 1);
      }
    } catch {
      setErrorMsg("Review update failed.");
    } finally {
      setReviewingId(null);
    }
  };

  const startReview = () => {
    setQuizIdx(0);
    setQuizResult(null);
    setMode("review");
  };

  const masteredCount = items.filter(i => i.mastery_level >= 4).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/skills")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Trainers
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">Vocabulary Builder</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Words", value: items.length, icon: <BookOpen className="h-4 w-4 text-primary" /> },
            { label: "Due for Review", value: dueItems.length, icon: <Clock className="h-4 w-4 text-yellow-400" /> },
            { label: "Mastered", value: masteredCount, icon: <Star className="h-4 w-4 text-emerald-400" /> },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card/30 p-3 flex items-center gap-2">
              {s.icon}
              <div>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 bg-surface/50 p-1 rounded-xl border border-border">
          {(["library", "review"] as const).map(m => (
            <button key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                mode === m ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "review" ? `Review (${dueItems.length} due)` : "My Library"}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl border border-red-400/30 bg-red-400/5 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── LIBRARY mode ── */}
          {mode === "library" && (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Generate button */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/30">
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="text-xs rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  {["beginner", "intermediate", "advanced"].map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={generateWord}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {generating
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                    : <><Sparkles className="h-3 w-3" /> Generate AI Word</>}
                </button>
                <p className="text-xs text-muted-foreground/60 flex-1 text-right hidden sm:block">
                  AI picks a new word at your difficulty
                </p>
              </div>

              {/* Word list */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl border border-border bg-card/20 animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No words yet. Generate your first word!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <motion.div key={item.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl border border-border bg-card/30 hover:border-primary/30 transition-all p-4 flex items-start gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{item.word}</span>
                          <DiffBadge level={item.difficulty} />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.definition}</p>
                        {item.example_sentence && (
                          <p className="text-[11px] text-muted-foreground/60 italic mt-1 line-clamp-1">
                            "{item.example_sentence}"
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <MasteryDots level={item.mastery_level} />
                        <span className="text-[10px] text-muted-foreground">{item.review_count}× reviewed</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── REVIEW mode ── */}
          {mode === "review" && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {dueItems.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mb-6">No words are due for review right now. Check back later.</p>
                  <button onClick={() => setMode("library")}
                    className="flex items-center gap-1.5 mx-auto text-sm text-primary hover:underline">
                    <BookOpen className="h-3.5 w-3.5" /> View library
                  </button>
                </div>
              ) : quizIdx < dueItems.length ? (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{quizIdx + 1} of {dueItems.length} cards</span>
                    <div className="h-1.5 w-32 bg-border/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${((quizIdx) / dueItems.length) * 100}%` }} />
                    </div>
                  </div>
                  <Flashcard
                    key={dueItems[quizIdx].id}
                    item={dueItems[quizIdx]}
                    onResult={(remembered) => handleReview(dueItems[quizIdx].id, remembered)}
                  />
                </>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <TrendingUp className="h-12 w-12 text-primary/50 mx-auto" />
                  <h3 className="text-lg font-bold text-foreground">Review Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    You reviewed {dueItems.length} {dueItems.length === 1 ? "word" : "words"}.
                  </p>
                  <button onClick={() => { setMode("library"); loadData(); }}
                    className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition-all">
                    <BookOpen className="h-4 w-4" /> Back to Library
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
