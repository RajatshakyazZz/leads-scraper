"use client";

import { LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
    <main className="min-h-screen px-4 py-8 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="h-11 w-11 rounded-md bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div className="font-display text-3xl leading-none mt-4">
            Lead <span className="text-muted-foreground">→</span> Launch
          </div>
          <div className="text-[11px] text-muted-foreground leading-tight tracking-wide uppercase mt-2">
            Client acquisition workspace
          </div>
        </div>

        <Card className="w-full rounded-lg">
          <CardHeader className="text-center px-6 pt-7">
            <h1 className="font-heading text-xl leading-snug font-medium">Sign in to your account</h1>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              Use your Google account to continue.
            </p>
            <Button
              onClick={handleGoogleLogin}
              disabled={loading || !firebaseConfigured}
              className="w-full h-11 transition-transform duration-150 active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
              Continue with Google
            </Button>
            {statusMessage && <p className="text-center text-sm leading-relaxed text-muted-foreground">{statusMessage}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
