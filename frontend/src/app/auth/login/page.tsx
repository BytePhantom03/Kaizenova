"use client";
import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Mail, Lock, Eye, EyeOff, BrainCircuit, Target, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const justRegistered = searchParams.get("registered") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password.");
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/oauth/google", { 
        code: "mock_google_code_123", 
        redirect_uri: window.location.origin 
      });
      login(res.data.user, res.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Google Sign-In failed.");
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  const featureBullets = [
    { icon: <BrainCircuit className="h-4 w-4 text-primary" />, text: "AI-powered evaluation", num: "01" },
    { icon: <Target className="h-4 w-4 text-secondary" />, text: "Adaptive difficulty scaling", num: "02" },
    { icon: <Zap className="h-4 w-4 text-warning" />, text: "Real-time feedback", num: "03" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel — Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/8 noise-bg" />
        <div className="absolute top-[20%] left-[10%] h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]"
             style={{ animation: 'meshFloat1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-[20%] right-[10%] h-[250px] w-[250px] rounded-full bg-secondary/10 blur-[80px]"
             style={{ animation: 'meshFloat2 25s ease-in-out infinite' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="md" />

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Welcome back to Kaizenova
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Continue your journey to interview mastery with AI-powered adaptive practice sessions.
            </p>

            <div className="space-y-5">
              {featureBullets.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-[10px] font-mono font-bold text-muted-foreground/40 tracking-widest select-none">{item.num}</span>
                  <div className="h-8 w-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} Kaizenova</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          <div className="rounded-2xl border border-border bg-card/30 p-8 backdrop-blur-xl shadow-2xl card-shine">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign in to continue your preparation</p>
            </div>

            {/* Registration success banner */}
            <AnimatePresence>
              {justRegistered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-success/30 bg-success/10 text-success text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 animate-pulse" />
                  Account created successfully! Please sign in.
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              animate={shakeForm ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-accent text-center bg-accent/10 py-2.5 px-3 rounded-xl border border-accent/20"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link href="/auth/reset" className="text-xs text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  suffix={
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-6" loading={isLoading} disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </motion.form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card/30 px-3 text-muted-foreground backdrop-blur-sm">or continue with</span>
              </div>
            </div>

            {/* Social login buttons (visual only) */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleGoogleLogin} disabled={isLoading} variant="outline" size="sm" className="text-xs hover:border-blue-400/40 hover:bg-blue-400/5" type="button">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </Button>
              <Button variant="outline" size="sm" className="text-xs hover:border-purple-400/40 hover:bg-purple-400/5" type="button">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Register free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
