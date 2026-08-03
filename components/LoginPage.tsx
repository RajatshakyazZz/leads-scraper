"use client";

import Image from "next/image";
import { LogIn } from "lucide-react";
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
    <main className="min-h-screen px-4 py-12 sm:px-6 flex items-center justify-center bg-background bg-texture-grid relative overflow-hidden">
      {/* Background light blue glow ambient circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="DizoPulse"
            width={160}
            height={50}
            priority
            className="mx-auto h-auto w-[130px] sm:w-[160px]"
          />
          <div className="font-sans font-bold text-2.5xl tracking-tight leading-none mt-4 text-slate-900 flex items-center gap-1">
            Dizo<span className="text-sky-600 font-extrabold">Pulse</span>
          </div>
          <div className="text-[10px] text-sky-600/90 leading-tight tracking-[0.16em] uppercase mt-1.5 font-sans font-bold">
            Leads Scraper
          </div>
        </div>




        <Card className="w-full rounded-2xl border border-sky-100 bg-white/90 backdrop-blur-md shadow-xl shadow-sky-500/5">
          <CardHeader className="text-center px-6 pt-6 pb-2">
            <h1 className="font-sans font-bold text-xl tracking-tight text-slate-900">Sign in to your account</h1>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <p className="text-center text-sm leading-relaxed text-slate-500 font-sans">
              Connect your Google account to get access to the scraping and auditing dashboard.
            </p>
            <Button
              onClick={handleGoogleLogin}
              disabled={loading || !firebaseConfigured}
              className="w-full h-10.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-md shadow-sky-600/20 cursor-pointer transition-all"
            >
              <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
              Continue with Google
            </Button>
            {statusMessage && <p className="text-center text-xs leading-relaxed text-rose-600 font-mono mt-2">{statusMessage}</p>}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}


