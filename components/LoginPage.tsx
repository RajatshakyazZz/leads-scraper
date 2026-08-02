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
    <main className="min-h-screen px-4 py-12 sm:px-6 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-xs">
            <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="font-sans font-bold text-2xl leading-none mt-4 text-foreground">
            Lead <span className="text-muted-foreground/60 font-normal">→</span> Launch
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight tracking-[0.14em] uppercase mt-2 font-sans font-semibold">
            Client Acquisition Workspace
          </div>
        </div>

        <Card className="w-full rounded-xl border border-border bg-white shadow-premium">
          <CardHeader className="text-center px-6 pt-6 pb-2">
            <h1 className="font-sans font-bold text-xl tracking-tight text-foreground">Sign in to your account</h1>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <p className="text-center text-sm leading-relaxed text-muted-foreground font-sans">
              Connect your Google account to get access to the scraping and auditing dashboard.
            </p>
            <Button
              onClick={handleGoogleLogin}
              disabled={loading || !firebaseConfigured}
              className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs cursor-pointer transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
              Continue with Google
            </Button>
            {statusMessage && <p className="text-center text-xs leading-relaxed text-destructive font-mono mt-2">{statusMessage}</p>}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

