"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { AnalysisFull } from "@/lib/types";
import { ScoreGauge } from "@/components/score-gauge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").slice(0, 2) ?? [];
  const [analyses, setAnalyses] = useState<(AnalysisFull | null)[]>([
    null,
    null,
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ids.length < 2) {
      setIsLoading(false);
      return;
    }

    async function fetchBoth() {
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await apiFetch(`/api/analyses/${id}`);
            if (!res.ok) return null;
            return res.json() as Promise<AnalysisFull>;
          })
        );
        setAnalyses(results);
      } catch {
        // leave nulls
      } finally {
        setIsLoading(false);
      }
    }

    fetchBoth();
  }, []);

  if (ids.length < 2) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "History", href: "/history" },
            { label: "Compare" },
          ]}
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground">
              Select two analyses from the History page to compare them.
            </p>
            <Button asChild>
              <Link href="/history">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Go to History
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "History", href: "/history" },
            { label: "Compare" },
          ]}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mx-auto h-[140px] w-[140px] rounded-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const [a, b] = analyses;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "History", href: "/history" },
          { label: "Compare" },
        ]}
      />

      <h1 className="text-2xl font-bold tracking-tight">
        Side-by-Side Comparison
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {[a, b].map((analysis, i) => {
          if (!analysis) {
            return (
              <Card key={i}>
                <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                  Analysis not found
                </CardContent>
              </Card>
            );
          }

          const score = analysis.overall_score
            ? parseFloat(analysis.overall_score)
            : null;
          const gaps = analysis.skill_gaps;
          const breakdown = analysis.score_breakdown;

          return (
            <Card key={analysis.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Analysis #{analysis.id.slice(0, 8)}
                  <span className="ml-2 text-xs">
                    {analysis.completed_at
                      ? new Date(analysis.completed_at).toLocaleDateString()
                      : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Score */}
                {score !== null && (
                  <div className="flex justify-center">
                    <ScoreGauge score={score} size={140} />
                  </div>
                )}

                {/* Breakdown */}
                {breakdown && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Breakdown
                    </p>
                    {[
                      ["Skill Match", breakdown.skill_match],
                      ["Seniority", breakdown.seniority_alignment],
                      ["GitHub", breakdown.github_signal],
                      ["Bonus", breakdown.bonus_factors],
                    ].map(([label, val]) => (
                      <div
                        key={label as string}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">
                          {(val as number).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {gaps && (
                  <div className="space-y-3">
                    {gaps.matchedSkills.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          Matched ({gaps.matchedSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {gaps.matchedSkills.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-xs"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {gaps.missingRequired.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          Missing Required ({gaps.missingRequired.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {gaps.missingRequired.map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="border-red-300 text-xs text-red-700 dark:text-red-400"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Score delta */}
      {a?.overall_score && b?.overall_score && (
        <Card>
          <CardContent className="flex items-center justify-center gap-4 p-6">
            <span className="text-sm text-muted-foreground">
              Score difference:
            </span>
            <span
              className={cn(
                "text-xl font-bold",
                parseFloat(a.overall_score) > parseFloat(b.overall_score)
                  ? "text-green-600 dark:text-green-400"
                  : parseFloat(a.overall_score) < parseFloat(b.overall_score)
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              )}
            >
              {(
                parseFloat(a.overall_score) - parseFloat(b.overall_score)
              ).toFixed(1)}{" "}
              points
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
