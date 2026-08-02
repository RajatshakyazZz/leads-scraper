"use client";

import { LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

export function LoginPage() {
  const { authError, firebaseConfigured, loading, signInWithGoogle } = useAuth();
  const statusMessage = !firebaseConfigured ? "Google sign-in is not available in this environment." : authError;

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 flex items-center justify-center bg-radial from-background via-background to-secondary/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-accent hover:scale-105 transition-transform duration-300">
            <Sparkles className="h-5.5 w-5.5 text-primary-foreground" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="font-display text-3.5xl leading-none mt-5 text-foreground font-semibold">
            Lead <span className="text-muted-foreground/60 font-light">→</span> Launch
          </div>
          <div className="text-[10px] text-muted-foreground/80 leading-tight tracking-[0.15em] uppercase mt-2 font-sans font-semibold">
            Client Acquisition Workspace
          </div>
        </div>

        <Card className="w-full rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
          <CardHeader className="text-center px-8 pt-8 pb-4">
            <h1 className="font-display text-2xl tracking-tight leading-snug font-medium text-foreground">Sign in to your account</h1>
          </CardHeader>
          <CardContent className="space-y-5 px-8 pb-8">
            <p className="text-center text-sm leading-relaxed text-muted-foreground/90 font-sans">
              Connect your Google account to get access to the scraping and auditing dashboard.
            </p>
            <Button
              onClick={handleGoogleLogin}
              disabled={loading || !firebaseConfigured}
              className="w-full h-11 rounded-xl transition-all duration-200 shadow-sm shadow-primary/10 hover:shadow-md hover:shadow-primary/20 cursor-pointer"
            >
              <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
              Continue with Google
            </Button>
            {statusMessage && <p className="text-center text-xs leading-relaxed text-destructive/80 font-mono mt-2">{statusMessage}</p>}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
