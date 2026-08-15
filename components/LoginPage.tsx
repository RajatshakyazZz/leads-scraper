"use client";

import { useState } from "react";
import Image from "next/image";
import { LogIn, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "signin" | "signup" | "forgot";

function parseFirebaseError(err: Error): string {
  const message = err.message || "";
  if (message.includes("auth/email-already-in-use")) {
    return "An account with this email already exists. Please sign in.";
  }
  if (message.includes("auth/wrong-password") || message.includes("auth/user-not-found") || message.includes("auth/invalid-credential")) {
    return "Invalid email or password. Please try again.";
  }
  if (message.includes("auth/weak-password")) {
    return "Password should be at least 6 characters long.";
  }
  if (message.includes("auth/invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Access blocked due to multiple failed attempts. Reset your password or try again later.";
  }
  return message.replace("Firebase: ", "");
}

export function LoginPage({ isModal = false, onSuccess }: { isModal?: boolean; onSuccess?: () => void }) {
  const { authError, firebaseConfigured, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const statusMessage = !firebaseConfigured ? "Authentication is not configured in this environment." : authError;

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (e) {
      toast.error(parseFirebaseError(e as Error));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (mode === "forgot") {
      setSubmitting(true);
      try {
        await sendPasswordReset(email);
        setResetSent(true);
        toast.success("Password reset email sent! Check your inbox.");
      } catch (err) {
        toast.error(parseFirebaseError(err as Error));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match. Please verify.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, displayName);
        toast.success("Account created successfully!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Signed in successfully!");
      }
    } catch (err) {
      toast.error(parseFirebaseError(err as Error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 flex items-center justify-center bg-[#080B11] relative overflow-hidden">
      {/* Background ambient light lime glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo & Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/icon.png"
            alt="ClientForge"
            width={64}
            height={64}
            priority
            className="mx-auto h-16 w-16 object-contain rounded-2xl border border-lime-500/40 p-1 bg-slate-950 shadow-lg shadow-lime-500/20"
          />
          <div className="font-sans font-black text-3xl tracking-tight leading-none mt-4 text-white uppercase flex items-center gap-1">
            CLIENT<span className="text-lime-400 font-black">FORGE</span>
          </div>
          <div className="text-[10px] text-lime-400/90 leading-tight tracking-[0.2em] uppercase mt-1.5 font-mono font-bold">
            LEADS ➔ CONVERSION
          </div>
        </div>

        <Card className="w-full rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Mode Switcher Tabs */}
          {mode !== "forgot" && (
            <div className="grid grid-cols-2 p-1.5 bg-slate-900 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setMode("signin")}
                aria-label="Switch to Sign In mode"
                className={`min-h-[44px] py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center ${
                  mode === "signin"
                    ? "bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                aria-label="Switch to Create Account mode"
                className={`min-h-[44px] py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center ${
                  mode === "signup"
                    ? "bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          <CardHeader className="text-center px-6 pt-5 pb-2">
            <h1 className="font-sans font-black text-xl tracking-tight text-white uppercase">
              {mode === "signin" && "Welcome Back"}
              {mode === "signup" && "Create your Account"}
              {mode === "forgot" && "Reset Password"}
            </h1>
            <p className="text-xs leading-relaxed text-slate-400 font-sans mt-1">
              {mode === "signin" && "Sign in with your email or Google account to access your lead dashboard."}
              {mode === "signup" && "Get started with free scraping credits instantly."}
              {mode === "forgot" && "Enter your registered email address to receive a password reset link."}
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-2 space-y-4">
            <AnimatePresence mode="wait">
              {mode === "forgot" && resetSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-lime-500/10 border border-lime-500/30 rounded-xl p-4 text-center space-y-2"
                >
                  <CheckCircle2 className="h-8 w-8 text-lime-400 mx-auto" />
                  <div className="font-black text-sm text-white">Password Reset Email Sent!</div>
                  <p className="text-xs text-slate-300">
                    We sent a password reset link to <strong className="text-white">{email}</strong>. Check your inbox and click the link to update your password.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResetSent(false);
                      setMode("signin");
                    }}
                    className="mt-2 text-xs font-black uppercase tracking-wider rounded-xl border-slate-700 bg-slate-900 text-lime-400 hover:bg-slate-800"
                  >
                    Back to Sign In
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleSubmit}
                  className="space-y-3.5"
                >
                  {/* Display Name field (Sign Up only) */}
                  {mode === "signup" && (
                    <div className="space-y-1">
                      <label htmlFor="displayNameInput" className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block">Full Name</label>
                      <div className="relative">
                        <User className="h-4 w-4 absolute left-3 top-3.5 text-slate-500" />
                        <Input
                          id="displayNameInput"
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-9 h-11 rounded-xl border-slate-800 bg-slate-900 text-white text-xs font-bold focus:ring-1 focus:ring-lime-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email field */}
                  <div className="space-y-1">
                    <label htmlFor="emailInput" className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block">Email Address</label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-3.5 text-slate-500" />
                      <Input
                        id="emailInput"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-11 rounded-xl border-slate-800 bg-slate-900 text-white text-xs font-bold focus:ring-1 focus:ring-lime-400"
                      />
                    </div>
                  </div>

                  {/* Password field (Sign In & Sign Up) */}
                  {mode !== "forgot" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="passwordInput" className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block">Password</label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            onClick={() => setMode("forgot")}
                            aria-label="Forgot Password"
                            className="min-h-[44px] px-1 inline-flex items-center text-[11px] font-bold text-lime-400 hover:underline"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="h-4 w-4 absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                        <Input
                          id="passwordInput"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-12 h-11 rounded-xl border-slate-800 bg-slate-900 text-white text-xs font-bold focus:ring-1 focus:ring-lime-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-1 top-0.5 h-10 w-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-400"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirm Password field (Sign Up only) */}
                  {mode === "signup" && (
                    <div className="space-y-1">
                      <label htmlFor="confirmPasswordInput" className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block">Confirm Password</label>
                      <div className="relative">
                        <Lock className="h-4 w-4 absolute left-3 top-3.5 text-slate-500" />
                        <Input
                          id="confirmPasswordInput"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-9 h-11 rounded-xl border-slate-800 bg-slate-900 text-white text-xs font-bold focus:ring-1 focus:ring-lime-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting || loading || !firebaseConfigured}
                    aria-label={mode === "signin" ? "Sign In with Email" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                    className="w-full h-11 min-h-[44px] rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer transition-all mt-2"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-slate-950" />
                    ) : mode === "signin" ? (
                      <LogIn className="h-4 w-4 mr-2" />
                    ) : mode === "signup" ? (
                      <Zap className="h-4 w-4 mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {mode === "signin" && "Sign In with Email"}
                    {mode === "signup" && "Create Account"}
                    {mode === "forgot" && "Send Reset Link"}
                  </Button>

                  {/* Back to Sign In Link for Forgot Password */}
                  {mode === "forgot" && (
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      aria-label="Back to Sign In"
                      className="w-full min-h-[44px] text-center text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 pt-1 uppercase tracking-wider font-mono"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                    </button>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

            {/* Divider and Google Login */}
            {mode !== "forgot" && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest font-extrabold">
                    <span className="bg-[#111726] px-2.5 text-slate-500">OR</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || !firebaseConfigured}
                  aria-label={mode === "signin" ? "Sign In with Google" : "Sign Up with Google"}
                  variant="outline"
                  className="w-full h-11 min-h-[44px] rounded-xl border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {mode === "signin" ? "Sign In with Google" : "Sign Up with Google"}
                </Button>
              </>
            )}

            {statusMessage && <p className="text-center text-xs leading-relaxed text-red-400 font-mono mt-2 font-bold">{statusMessage}</p>}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
