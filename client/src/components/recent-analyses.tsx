"use client";

import Link from "next/link";
import { useRecentAnalyses } from "@/hooks/useAnalysisData";
import type { AnalysisSummary } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
  },
} as const;

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
}

export function RecentAnalyses() {
  const { data, isLoading, error } = useRecentAnalyses();

  const analyses = data?.analyses ?? [];
  const total = data?.total ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Recent Analyses</CardTitle>
        {total > 3 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-6">
            Failed to load recent analyses.
          </p>
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileSearch className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing yet. Run one above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis: AnalysisSummary) => {
              const config = statusConfig[analysis.status];
              const StatusIcon = config.icon;
              const score = analysis.overall_score
                ? parseFloat(analysis.overall_score)
                : null;

              return (
                <Link
                  key={analysis.id}
                  href={`/analysis/${analysis.id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-xs", config.className)}
                      >
                        <StatusIcon
                          className={cn(
                            "mr-1 h-3 w-3",
                            analysis.status === "processing" && "animate-spin"
                          )}
                        />
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {formatDate(analysis.created_at)}
                      </span>
                    </div>

                    {score !== null && (
                      <span
                        className={cn(
                          "text-sm font-semibold shrink-0",
                          score >= 80
                            ? "text-green-700"
                            : score >= 60
                              ? "text-yellow-700"
                              : "text-red-700"
                        )}
                      >
                        {Math.round(score)}%
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
