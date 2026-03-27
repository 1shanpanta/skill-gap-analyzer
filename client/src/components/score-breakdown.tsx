"use client";

import type { ScoreBreakdown } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
}

interface BarItem {
  label: string;
  value: number;
  weightKey: string;
  color: string;
  bg: string;
}

const BARS: BarItem[] = [
  {
    label: "Skill Match",
    value: 0,
    weightKey: "skill_match",
    color: "bg-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Seniority Alignment",
    value: 0,
    weightKey: "seniority_alignment",
    color: "bg-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    label: "GitHub Signal",
    value: 0,
    weightKey: "github_signal",
    color: "bg-accent",
    bg: "bg-accent/10",
  },
  {
    label: "Bonus Factors",
    value: 0,
    weightKey: "bonus_factors",
    color: "bg-amber-500",
    bg: "bg-amber-500/10",
  },
];

export function ScoreBreakdownCard({ breakdown }: ScoreBreakdownProps) {
  const items: (BarItem & { actualValue: number; weight: number })[] =
    BARS.map((bar) => ({
      ...bar,
      actualValue:
        breakdown[bar.weightKey as keyof ScoreBreakdown] as number ?? 0,
      weight: breakdown.weights_used?.[bar.weightKey] ?? 0,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const percentage = Math.max(0, Math.min(100, item.actualValue));
          return (
            <div key={item.weightKey} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {Math.round(item.weight * 100)}%w
                  </span>
                  <span className="font-bold tabular-nums text-foreground">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${item.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
          <span className="text-sm font-semibold text-foreground">
            Weighted Total
          </span>
          <span className="text-xl font-extrabold tracking-tight text-primary">
            {Math.round(breakdown.weighted_total)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
