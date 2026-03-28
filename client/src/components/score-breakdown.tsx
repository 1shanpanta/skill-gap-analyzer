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
}

const BARS: BarItem[] = [
  {
    label: "Skill Match",
    value: 0,
    weightKey: "skill_match",
    color: "bg-blue-500",
  },
  {
    label: "Seniority Alignment",
    value: 0,
    weightKey: "seniority_alignment",
    color: "bg-purple-500",
  },
  {
    label: "GitHub Signal",
    value: 0,
    weightKey: "github_signal",
    color: "bg-emerald-500",
  },
  {
    label: "Bonus Factors",
    value: 0,
    weightKey: "bonus_factors",
    color: "bg-amber-500",
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
            <div key={item.weightKey} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    weight: {Math.round(item.weight * 100)}%
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${item.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm font-semibold text-foreground">
            Weighted Total
          </span>
          <span className="text-lg font-bold text-foreground">
            {Math.round(breakdown.weighted_total)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
