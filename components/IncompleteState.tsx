"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function IncompleteState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <Card className="max-w-xl mx-auto rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 my-8">
      <CardContent className="pt-8 pb-8 px-6 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-sans font-bold text-lg tracking-tight text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-sans">{description}</p>
        </div>
        {onAction && (
          <Button onClick={onAction} className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 cursor-pointer transition-all">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
