"use client";
/**
 * LearningHub — Full-screen learning overlay for every skill trainer.
 *
 * Architecture:
 * - Receives `trainerType` and renders all sections dynamically from LEARNING_CONTENT
 * - Zero hardcoding — all content comes from src/lib/learning-content.ts
 * - Reusable across all 12 trainers without modification
 */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X, ChevronRight, ChevronDown, BookOpen, Target, Lightbulb, AlertCircle,
  CheckCircle2, XCircle, Star, ExternalLink, ArrowRight, PlayCircle,
  BarChart2, Zap, Award, Users, Clock, Check, Circle,
  MessageSquare, Layers, TrendingUp, Globe,
} from "lucide-react";
import { getLearningContent, SkillLearningContent } from "@/lib/learning-content";

// ── Section ID map for sidebar nav ─────────────────────────────────────────
const SECTIONS = [
  { id: "overview",    label: "Overview",          icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: "fundamentals", label: "Fundamentals",     icon: <Layers className="h-3.5 w-3.5" /> },
  { id: "roadmap",    label: "Learning Roadmap",   icon: <Target className="h-3.5 w-3.5" /> },
  { id: "tips",       label: "Tips & Tricks",      icon: <Lightbulb className="h-3.5 w-3.5" /> },
  { id: "mistakes",   label: "Common Mistakes",    icon: <AlertCircle className="h-3.5 w-3.5" /> },
  { id: "examples",   label: "Real Examples",      icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: "exercises",  label: "Exercises",          icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "resources",  label: "Resources",          icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "checklist",  label: "Pre-Practice Checklist", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
];

const PLATFORM_COLORS: Record<string, string> = {
  "YouTube": "text-red-400 bg-red-400/10 border-red-400/20",
  "Coursera (Free Audit)": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "BBC / Web": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Web": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Podcast": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "App / Web": "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "LinkedIn": "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

const LEVEL_COLORS = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Advanced: "text-red-400 bg-red-400/10 border-red-400/30",
};

const ROUTE_MAP: Record<string, string> = {
  speaking: "/skills/speaking", fluency: "/skills/fluency",
  ielts: "/skills/ielts", vocabulary: "/skills/vocabulary",
  grammar: "/skills/grammar", hr: "/skills/hr",
  public: "/skills/public", email: "/skills/email",
  storytelling: "/skills/storytelling", leadership: "/skills/leadership",
  negotiation: "/skills/negotiation", confidence: "/skills/confidence",
};

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  trainerType: string;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LearningHub({ trainerType, onClose }: Props) {
  const router = useRouter();
  const content = getLearningContent(trainerType);
  const [activeSection, setActiveSection] = useState("overview");
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Intersection observer for active nav highlight
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { root: contentRef.current, threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [content]);

  if (!content) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Learning content not available yet for this trainer.</p>
          <button onClick={onClose} className="mt-4 text-primary hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleCheck = (i: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const allChecked = checkedItems.size === content.checklist.length;
  const practiceRoute = ROUTE_MAP[trainerType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
      >
        {/* ── Top bar ── */}
        <div className="h-14 border-b border-border/60 flex items-center px-4 gap-3 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-surface transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">{content.title} — How to Learn</div>
            <div className="text-xs text-muted-foreground">{content.tagline}</div>
          </div>
          <button
            onClick={() => practiceRoute && router.push(practiceRoute)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Start Practice
          </button>
        </div>

        {/* ── Layout ── */}
        <div className="flex h-[calc(100vh-56px)]">
          {/* Sidebar */}
          <nav className="w-56 border-r border-border/60 p-3 flex-shrink-0 overflow-y-auto bg-card/20 hidden md:flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-2">Sections</p>
            {SECTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                  activeSection === id
                    ? "bg-primary/15 text-primary font-semibold border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                {icon} {label}
              </button>
            ))}
            <div className="mt-auto pt-4 border-t border-border/40">
              <div className="text-[10px] text-muted-foreground/60 px-2 mb-2">Checklist progress</div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden mx-2">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(checkedItems.size / content.checklist.length) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground/60 px-2 mt-1">
                {checkedItems.size}/{content.checklist.length} complete
              </div>
            </div>
          </nav>

          {/* Main content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-16">

            {/* ── 1. Overview ── */}
            <section ref={el => { sectionRefs.current["overview"] = el; }} id="overview">
              <SectionHeader icon={<BookOpen className="h-5 w-5" />} title="Skill Overview" />
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <InfoCard title="What is this skill?" content={content.overview.what} />
                <InfoCard title="Why does it matter?" content={content.overview.why} />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="rounded-2xl border border-border bg-card/30 p-5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Where it is used</h4>
                  <ul className="space-y-2">
                    {content.overview.where.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">💡 Real-World Impact</h4>
                  <p className="text-sm text-foreground leading-relaxed">{content.overview.realWorldContext}</p>
                </div>
              </div>
            </section>

            {/* ── 2. Fundamentals ── */}
            <section ref={el => { sectionRefs.current["fundamentals"] = el; }} id="fundamentals">
              <SectionHeader icon={<Layers className="h-5 w-5" />} title="Fundamentals" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {content.fundamentals.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="rounded-2xl border border-border bg-card/30 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="text-2xl mb-2">{f.emoji}</div>
                    <div className="text-sm font-semibold text-foreground mb-1">{f.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{f.description}</div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 3. Learning Roadmap ── */}
            <section ref={el => { sectionRefs.current["roadmap"] = el; }} id="roadmap">
              <SectionHeader icon={<Target className="h-5 w-5" />} title="Step-by-Step Learning Roadmap" />
              <div className="mt-4 space-y-0">
                {content.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Step connector */}
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{step.step}</span>
                      </div>
                      {i < content.steps.length - 1 && (
                        <div className="w-px flex-1 bg-border/60 my-1" />
                      )}
                    </div>
                    {/* Step card */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex-1 mb-4 rounded-2xl border bg-card/30 p-4 ${i < content.steps.length - 1 ? "" : ""}`}
                    >
                      <div className="text-sm font-semibold text-foreground mb-1">{step.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed mb-3">{step.description}</div>
                      <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-2.5">
                        <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-primary font-medium">{step.action}</span>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 4. Tips ── */}
            <section ref={el => { sectionRefs.current["tips"] = el; }} id="tips">
              <SectionHeader icon={<Lightbulb className="h-5 w-5" />} title="Tips & Tricks" />
              <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
                {content.tips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{tip}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 5. Common Mistakes ── */}
            <section ref={el => { sectionRefs.current["mistakes"] = el; }} id="mistakes">
              <SectionHeader icon={<AlertCircle className="h-5 w-5" />} title="Common Mistakes to Avoid" />
              <div className="mt-4 space-y-2.5">
                {content.commonMistakes.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3"
                  >
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{m}</span>
                  </motion.div>
                ))}
              </div>
              {/* Best Practices */}
              <h3 className="text-sm font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" /> Best Practices
              </h3>
              <div className="space-y-2.5">
                {content.bestPractices.map((bp, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <Star className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{bp}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 6. Real Examples ── */}
            <section ref={el => { sectionRefs.current["examples"] = el; }} id="examples">
              <SectionHeader icon={<MessageSquare className="h-5 w-5" />} title="Real Examples" />
              {content.realExamples.map((ex, i) => (
                <div key={i} className="mt-4 rounded-2xl border border-border bg-card/30 overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{ex.label}</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Bad */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-xs font-semibold text-red-400">Weak Response</span>
                      </div>
                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-foreground italic">"{ex.bad}"</div>
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-red-400/80">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {ex.whyBad}
                      </div>
                    </div>
                    {/* Improved */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400">Good Response</span>
                      </div>
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-foreground italic">"{ex.improved}"</div>
                    </div>
                    {/* Expert */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400">Expert Response</span>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-foreground italic">"{ex.expert}"</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* ── 7. Exercises ── */}
            <section ref={el => { sectionRefs.current["exercises"] = el; }} id="exercises">
              <SectionHeader icon={<Zap className="h-5 w-5" />} title="Practice Exercises" />
              <p className="text-xs text-muted-foreground mt-1 mb-4">Complete these before starting your first AI session to warm up.</p>
              <div className="space-y-2.5">
                {content.exercises.map((ex, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card/30 p-3.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="h-5 w-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <span className="text-sm text-foreground">{ex}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 8. Resources ── */}
            <section ref={el => { sectionRefs.current["resources"] = el; }} id="resources">
              <SectionHeader icon={<Globe className="h-5 w-5" />} title="Free Learning Resources" />
              <p className="text-xs text-muted-foreground mt-1 mb-4">Hand-picked, high-quality free resources recommended for this skill.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {content.resources.map((res, i) => (
                  <motion.a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="group rounded-2xl border border-border bg-card/30 p-4 flex flex-col gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {res.title}
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{res.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${PLATFORM_COLORS[res.platform] || "text-muted-foreground border-border bg-surface"}`}>
                        {res.platform}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${LEVEL_COLORS[res.level]}`}>
                        {res.level}
                      </span>
                      {res.isFree && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
                          Free
                        </span>
                      )}
                      {res.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {res.duration}
                        </span>
                      )}
                    </div>
                  </motion.a>
                ))}
              </div>
            </section>

            {/* ── 9. Checklist ── */}
            <section ref={el => { sectionRefs.current["checklist"] = el; }} id="checklist">
              <SectionHeader icon={<CheckCircle2 className="h-5 w-5" />} title="Pre-Practice Checklist" />
              <p className="text-xs text-muted-foreground mt-1 mb-4">Tick each item when ready. Complete all before starting your AI practice session.</p>
              <div className="rounded-2xl border border-border bg-card/30 divide-y divide-border/40 overflow-hidden">
                {content.checklist.map((item, i) => {
                  const checked = checkedItems.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleCheck(i)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-surface/50 transition-colors ${checked ? "bg-emerald-500/5" : ""}`}
                    >
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checked ? "bg-emerald-500 border-emerald-500" : "border-border"
                      }`}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-sm transition-colors ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Progress feedback */}
              {checkedItems.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 rounded-xl border p-3 text-sm font-medium text-center ${
                    allChecked
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-primary/20 bg-primary/5 text-primary"
                  }`}
                >
                  {allChecked
                    ? "🎉 You are fully prepared! Start your practice session below."
                    : `${checkedItems.size}/${content.checklist.length} complete — keep going!`}
                </motion.div>
              )}
            </section>

            {/* ── CTA ── */}
            <section className="pb-12">
              <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="text-xl font-bold text-foreground mb-2">Ready to practice?</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  You have covered the theory. Now let the AI coach evaluate your real performance and give you personalised feedback.
                </p>
                <button
                  onClick={() => practiceRoute && router.push(practiceRoute)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-background font-bold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                >
                  <PlayCircle className="h-4 w-4" />
                  Start {content.title} Practice
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
      <div className="text-primary">{icon}</div>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
  );
}

function InfoCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/30 p-5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h4>
      <p className="text-sm text-foreground leading-relaxed">{content}</p>
    </div>
  );
}
