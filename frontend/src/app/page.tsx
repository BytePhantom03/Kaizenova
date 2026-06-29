"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  Sparkles, BrainCircuit, Target, Activity,
  Zap, TrendingUp, Shield, ArrowRight,
  Settings2, MessageSquare, BarChart3
} from "lucide-react";
import Link from "next/link";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const features = [
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: "Adaptive Difficulty",
    desc: "Questions scale up or down automatically based on your real-time performance.",
    color: "text-primary",
    bg: "bg-primary/10",
    glow: "group-hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Pinpoint Evaluation",
    desc: "Analyzes grammar, syntax, completeness, and domain knowledge simultaneously.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    glow: "group-hover:shadow-[0_0_30px_rgba(138,43,226,0.1)]",
  },
  {
    icon: <Activity className="h-6 w-6" />,
    title: "Confidence Scoring",
    desc: "Audio analysis grades your speaking rate, pauses, and filler word usage.",
    color: "text-accent",
    bg: "bg-accent/10",
    glow: "group-hover:shadow-[0_0_30px_rgba(255,0,85,0.1)]",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Real-Time Feedback",
    desc: "Get instant AI-powered evaluation after every answer with actionable insights.",
    color: "text-warning",
    bg: "bg-warning/10",
    glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Growth Analytics",
    desc: "Track your progress with detailed dashboards, streak systems, and readiness scores.",
    color: "text-success",
    bg: "bg-success/10",
    glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Company-Specific Prep",
    desc: "Practice with questions tailored to Google, Amazon, Microsoft, and more.",
    color: "text-info",
    bg: "bg-info/10",
    glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
  },
];

const steps = [
  {
    num: "01",
    icon: <Settings2 className="h-6 w-6 text-primary" />,
    title: "Configure your session",
    desc: "Set your target role, domain, difficulty level, and session duration.",
  },
  {
    num: "02",
    icon: <MessageSquare className="h-6 w-6 text-secondary" />,
    title: "Practice with AI",
    desc: "Answer adaptive questions and receive real-time AI evaluation on each response.",
  },
  {
    num: "03",
    icon: <BarChart3 className="h-6 w-6 text-success" />,
    title: "Track & improve",
    desc: "Review deep analytics, follow AI coaching recommendations, and build streaks.",
  },
];

export default function Home() {
  return (
    <div className="noise-bg relative">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
        {/* ── Ambient Background ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-8%] h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]"
               style={{ animation: 'meshFloat1 20s ease-in-out infinite' }} />
          <div className="absolute bottom-[-15%] right-[-8%] h-[600px] w-[600px] rounded-full bg-secondary/12 blur-[150px]"
               style={{ animation: 'meshFloat2 25s ease-in-out infinite' }} />
          <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] rounded-full bg-accent/8 blur-[100px]"
               style={{ animation: 'meshFloat3 18s ease-in-out infinite' }} />
        </div>

        {/* ── Grid Dots Pattern ── */}
        <div
          className="fixed inset-0 pointer-events-none grid-dots opacity-30"
          style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, black, transparent)' }}
        />

        {/* ── Navbar ── */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] glass-strong"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Logo size="sm" />
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Start Free</Button>
              </Link>
            </div>
          </div>
        </motion.header>

        <main className="relative z-10">
          {/* ── Hero ── */}
          <section className="flex flex-col items-center justify-center px-4 sm:px-6 pt-32 sm:pt-40 pb-20">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="text-center max-w-4xl"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                <span>Next-Generation AI Interviewer</span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
                Master Every Interview with{" "}
                <br className="hidden sm:block" />
                <span className="text-shimmer">
                  Adaptive Intelligence
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-4 text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Kaizenova dynamically adjusts to your skill level in real-time, providing deep analytics on technical accuracy, communication, and confidence.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto shadow-[0_0_30px_rgba(0,240,255,0.25)]">
                    Start Preparing Free
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="font-medium">Trusted by <AnimatedCounter value={1200} suffix="+" className="text-foreground font-semibold" /> students</span>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex gap-4">
                {[
                  { label: "Adaptive AI", icon: <BrainCircuit className="h-3.5 w-3.5 text-primary" /> },
                  { label: "10K+ Questions", icon: <Zap className="h-3.5 w-3.5 text-warning" /> },
                  { label: "85% Success", icon: <TrendingUp className="h-3.5 w-3.5 text-success" /> },
                ].map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface/50 text-xs">
                    {item.icon}
                    {item.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ── Features ── */}
          <section id="features" className="px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Everything you need to ace your interview
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  A comprehensive AI-powered platform that evaluates, adapts, and coaches you through every dimension of interview readiness.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className={`group relative overflow-hidden rounded-2xl border border-border bg-card/30 p-7 backdrop-blur-sm transition-all duration-300 hover:border-border/80 hover:bg-card/50 card-shine ${feature.glow}`}
                  >
                    <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color} transition-transform duration-300 group-hover:scale-110`}>
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How it Works ── */}
          <section id="how-it-works" className="px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Get interview-ready in 3 simple steps
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Our AI adapts to your level, coaches your weaknesses, and tracks your growth.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connection line (desktop only) */}
                <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] flow-line" />

                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="relative text-center"
                  >
                    <div className="mx-auto mb-5 relative z-10">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated border border-border">
                        {step.icon}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-primary mb-2 tracking-widest">{step.num}</div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA Section ── */}
          <section className="px-4 sm:px-6 py-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="noise-bg max-w-4xl mx-auto relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/30 to-secondary/5 p-10 sm:p-16 text-center overflow-hidden"
            >
              {/* Glow effects */}
              <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-secondary/10 blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Ready to transform your interview skills?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of candidates who are leveling up with Kaizenova&apos;s AI-powered adaptive interview platform.
                </p>
                <Link href="/auth/register">
                  <Button size="lg" variant="gradient" className="shadow-[0_0_40px_rgba(0,240,255,0.2),0_0_80px_rgba(138,43,226,0.1)]">
                    Start Preparing — It&apos;s Free
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>

          {/* ── Footer ── */}
          <footer className="border-t border-border px-4 sm:px-6 py-8">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <Logo size="sm" />
              <nav className="flex items-center gap-6 text-xs text-muted-foreground">
                <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
              </nav>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>© {new Date().getFullYear()} Kaizenova. All rights reserved.</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-surface/50">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Built with AI
                </span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
