"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { User, Mail, Lock, Eye, EyeOff, BrainCircuit, BarChart3, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ], [password]);

  const score = checks.filter(c => c.met).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-danger", "bg-warning", "bg-yellow-400", "bg-success"];
  const textColors = ["", "text-danger", "text-warning", "text-yellow-400", "text-success"];

  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-2"
    >
      {/* Strength bar */}
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full bg-border overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${i <= score ? colors[score] : ""}`}
              initial={{ width: 0 }}
              animate={{ width: i <= score ? "100%" : "0%" }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </div>
        ))}
      </div>

      {/* Strength label with color transition */}
      <span className={`text-xs font-medium transition-colors duration-300 ${textColors[score]}`}>
        {labels[score]}
      </span>

      {/* Animated password criteria checklist */}
      <div className="mt-2.5 space-y-1.5">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative h-4 w-4 flex items-center justify-center flex-shrink-0">
              <AnimatePresence mode="wait">
                {check.met ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="h-4 w-4 rounded-full bg-success/20 flex items-center justify-center"
                  >
                    <Check className="h-2.5 w-2.5 text-success" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="h-3 w-3 rounded-full border border-border"
                  />
                )}
              </AnimatePresence>
            </div>
            <span className={`text-xs transition-colors duration-300 ${check.met ? "text-success" : "text-muted-foreground"}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/register", formData);
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      let errorMsg = err.response?.data?.detail;
      if (!errorMsg) {
        errorMsg = err.message || "Registration failed. Please check your connection or try a stronger password.";
      } else if (Array.isArray(errorMsg) && errorMsg.length > 0 && errorMsg[0].msg) {
        errorMsg = errorMsg[0].msg;
      }
      setError(typeof errorMsg === 'string' ? errorMsg : "Registration failed.");
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  const featureBullets = [
    { icon: <BrainCircuit className="h-4 w-4 text-primary" />, text: "Personalized practice sessions" },
    { icon: <BarChart3 className="h-4 w-4 text-secondary" />, text: "Detailed performance analytics" },
    { icon: <Sparkles className="h-4 w-4 text-warning" />, text: "AI-powered coaching" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background with noise texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/8 via-background to-primary/8 noise-bg" />
        <div className="absolute top-[20%] left-[10%] h-[300px] w-[300px] rounded-full bg-secondary/10 blur-[100px]"
             style={{ animation: 'meshFloat1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-[20%] right-[10%] h-[250px] w-[250px] rounded-full bg-primary/10 blur-[80px]"
             style={{ animation: 'meshFloat2 25s ease-in-out infinite' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="md" />

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Begin your interview mastery journey
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Join thousands of candidates leveling up with AI-powered adaptive interview preparation.
            </p>

            <div className="space-y-4">
              {featureBullets.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
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
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          {/* Form card with card-shine effect */}
          <div className="rounded-2xl border border-border bg-card/30 p-8 backdrop-blur-xl shadow-2xl card-shine">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
              <p className="text-sm text-muted-foreground mt-1">Start your interview preparation journey</p>
            </div>

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
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  icon={<User className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                  minLength={8}
                />
                <PasswordStrength password={formData.password} />
              </div>

              {/* Terms */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                By creating an account, you agree to our{" "}
                <span className="text-foreground/70 hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
                {" "}and{" "}
                <span className="text-foreground/70 hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>.
              </p>

              <Button type="submit" className="w-full mt-2" loading={isLoading} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Account"}
              </Button>
            </motion.form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
