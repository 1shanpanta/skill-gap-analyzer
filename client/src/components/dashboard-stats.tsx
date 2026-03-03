"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle2, Target, TrendingUp } from "lucide-react";

interface Stats {
  total: number;
  completed: number;
  average_score: number | null;
  status_counts: Record<string, number>;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiFetch("/api/analyses/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // Silently fail — stats are not critical
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || stats.total === 0) return null;

  const cards = [
    {
      label: "Total Analyses",
      value: stats.total,
      icon: BarChart3,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Avg Score",
      value: stats.average_score !== null ? `${Math.round(stats.average_score)}%` : "—",
      icon: Target,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Success Rate",
      value:
        stats.total > 0
          ? `${Math.round((stats.completed / stats.total) * 100)}%`
          : "—",
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={card.color}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
