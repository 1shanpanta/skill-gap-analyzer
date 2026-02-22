"use client";

import Link from "next/link";
import type { AnalysisSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  analysis: AnalysisSummary;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
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

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const config = statusConfig[analysis.status];
  const StatusIcon = config.icon;

  const score = analysis.overall_score
    ? parseFloat(analysis.overall_score)
    : null;

  return (
    <Link href={`/analysis/${analysis.id}`} className="block group">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn("shrink-0", config.className)}
                >
                  <StatusIcon
                    className={cn(
                      "mr-1 h-3 w-3",
                      analysis.status === "processing" && "animate-spin"
                    )}
                  />
                  {config.label}
                </Badge>
                <span className="text-sm text-muted-foreground truncate">
                  {formatDate(analysis.created_at)}
                </span>
              </div>

              {analysis.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Completed {formatDate(analysis.completed_at)}
                </p>
              )}
            </div>

            {score !== null && (
              <div
                className={cn(
                  "flex items-center justify-center shrink-0 w-12 h-12 rounded-full border-2 font-bold text-sm",
                  score >= 80
                    ? "border-green-500 text-green-700 dark:text-green-400 bg-green-500/10"
                    : score >= 60
                      ? "border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10"
                      : "border-red-500 text-red-700 dark:text-red-400 bg-red-500/10"
                )}
              >
                {Math.round(score)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
