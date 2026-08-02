"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";

export function IncompleteState({
  title,
  description,
  prevPhaseLabel,
  onPrev,
}: {
  title: string;
  description: string;
  prevPhaseLabel: string;
  onPrev?: () => void;
}) {
  return (
    <Card className="border-dashed border-border bg-white rounded-xl shadow-xs">
      <CardContent className="py-14 px-6 text-center max-w-xl mx-auto">
        <div className="h-10 w-10 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4 border border-border/60">
          <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1.5">
          Preview · No data yet
        </div>
        <h2 className="font-sans font-bold text-xl text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-sans">{description}</p>
        {onPrev && (
          <Button variant="outline" onClick={onPrev} className="h-9 px-4 rounded-lg border-border hover:bg-secondary/60 text-xs font-medium">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} />
            Go to {prevPhaseLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

