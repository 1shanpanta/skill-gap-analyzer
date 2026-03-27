"use client";

import { useAnalysisStats } from "@/hooks/useAnalysisData";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle2, Target, TrendingUp } from "lucide-react";

export function DashboardStats() {
  const { data: stats, isLoading } = useAnalysisStats();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || stats.total === 0) return null;

  const cards = [
    {
      label: "Analyses",
      value: stats.total,
      icon: BarChart3,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Avg Score",
      value: stats.average_score !== null ? `${Math.round(stats.average_score)}%` : "\u2014",
      icon: Target,
      accent: "bg-accent/10 text-accent",
    },
    {
      label: "Success Rate",
      value:
        stats.total > 0
          ? `${Math.round((stats.completed / stats.total) * 100)}%`
          : "\u2014",
      icon: TrendingUp,
      accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="group transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.accent}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-xl font-bold tracking-tight">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
