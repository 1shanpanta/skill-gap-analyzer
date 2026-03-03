"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisSummary } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Clock, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AnalysisCardProps {
  analysis: AnalysisSummary;
  onDeleted?: () => void;
  compareMode?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
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

export function AnalysisCard({
  analysis,
  onDeleted,
  compareMode,
  isSelected,
  onToggleCompare,
}: AnalysisCardProps) {
  const config = statusConfig[analysis.status];
  const StatusIcon = config.icon;
  const [isDeleting, setIsDeleting] = useState(false);

  const score = analysis.overall_score
    ? parseFloat(analysis.overall_score)
    : null;

  const canCompare = compareMode && analysis.status === "completed";

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/analyses/${analysis.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete");
      }
      toast.success("Analysis deleted");
      onDeleted?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete analysis"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCompareClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (canCompare) {
      onToggleCompare?.(analysis.id);
    }
  }

  const cardContent = (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md hover:border-primary/20 group-focus-visible:ring-2 group-focus-visible:ring-ring",
        isSelected && "ring-2 ring-primary border-primary/40"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          {canCompare && (
            <button
              type="button"
              onClick={handleCompareClick}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40 hover:border-primary"
              )}
              aria-label={isSelected ? "Deselect for comparison" : "Select for comparison"}
            >
              {isSelected && (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}

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

          <div className="flex items-center gap-3 shrink-0">
            {score !== null && (
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-sm",
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

            {!compareMode && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this analysis. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (canCompare) {
    return (
      <div
        className="block group cursor-pointer"
        onClick={handleCompareClick}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onToggleCompare?.(analysis.id);
          }
        }}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/analysis/${analysis.id}`} className="block group">
      {cardContent}
    </Link>
  );
}
