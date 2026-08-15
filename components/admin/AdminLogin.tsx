"use client";

import Image from "next/image";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAdmin } from "./AdminProvider";

export function AdminLogin() {
  const { login } = useAdmin();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    await login(password);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans selection:bg-lime-400 selection:text-slate-950">
      <Card className="w-full max-w-sm rounded-2xl border border-slate-800/90 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center space-y-3 pt-8 pb-4">
          <Image
            src="/icon.png"
            alt="ClientForge"
            width={44}
            height={44}
            priority
            className="mx-auto h-11 w-11 object-contain rounded-xl border border-lime-500/40 bg-slate-950 p-1 shadow-md shadow-lime-500/10"
          />
          <div>
            <CardTitle className="font-sans font-extrabold text-2xl text-white flex items-center justify-center gap-1 tracking-tight">
              CLIENT<span className="text-lime-400">FORGE</span>
            </CardTitle>
            <CardDescription className="text-xs text-lime-400 font-semibold uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-300">Admin Secret Key</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  disabled={loading}
                  className="pr-10 h-10.5 rounded-xl border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 text-sm focus-visible:ring-lime-500/30 focus-visible:border-lime-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-8 pt-2">
            <Button
              type="submit"
              disabled={!password || loading}
              className="w-full h-11 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold shadow-lg shadow-lime-500/10 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Access Admin Workspace"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
