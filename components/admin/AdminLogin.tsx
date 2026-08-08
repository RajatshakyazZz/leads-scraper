"use client";

import Image from "next/image";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-background bg-texture-grid p-4">
      <Card className="w-full max-w-sm rounded-2xl border border-sky-100 bg-white/95 shadow-xl shadow-sky-500/5">
        <CardHeader className="text-center space-y-3 pt-6">
          <Image
            src="/icon.png"
            alt="ClientForge"
            width={44}
            height={44}
            priority
            className="mx-auto h-11 w-11 object-contain rounded-xl border border-lime-500/30 bg-slate-950 p-1"
          />
          <div>
            <CardTitle className="font-sans font-bold text-2xl text-slate-900 flex items-center justify-center gap-1">
              CLIENT<span className="text-lime-600 font-black">FORGE</span>
            </CardTitle>
            <CardDescription className="text-xs text-lime-600/90 font-sans font-bold uppercase tracking-wider mt-1">Admin Panel</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  disabled={loading}
                  className="pr-10 h-10 rounded-xl border-sky-200 text-sm focus-visible:ring-1 focus-visible:ring-sky-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-6">
            <Button
              type="submit"
              disabled={!password || loading}
              className="w-full h-10.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md shadow-sky-600/20 cursor-pointer transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>

  );
}
