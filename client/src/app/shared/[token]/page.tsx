"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import type { AnalysisFull } from "@/lib/types";
import { ScoreGauge } from "@/components/score-gauge";
import { ScoreBreakdownCard } from "@/components/score-breakdown";
import { SkillGapChart } from "@/components/skill-gap-chart";
import { RoadmapViewer } from "@/components/roadmap-viewer";
import { SuggestionsViewer } from "@/components/suggestions-viewer";
import { GitHubSignals } from "@/components/github-signals";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Share2 } from "lucide-react";
import { posthog } from "@/lib/posthog";
import { useEffect } from "react";

type SharedAnalysis = Pick<
  AnalysisFull,
  | "id"
  | "overall_score"
  | "score_breakdown"
  | "skill_gaps"
  | "github_signals"
  | "roadmap"
  | "resume_suggestions"
  | "completed_at"
>;

async function sharedFetcher(url: string): Promise<SharedAnalysis> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? "This shared analysis doesn't exist or has been revoked."
        : "Failed to load shared analysis."
    );
  }
  return res.json();
}

export default function SharedAnalysisPage() {
  const params = useParams<{ token: string }>();
  const isValidToken = /^[a-f0-9]{64}$/.test(params.token || "");
  const { data: analysis, error, isLoading } = useSWR(
    isValidToken ? `/api/shared/${params.token}` : null,
    sharedFetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (analysis) {
      posthog.capture("share_link_viewed", {
        analysis_id: analysis.id,
        score: analysis.overall_score ? parseFloat(analysis.overall_score) : null,
      });
    }
  }, [analysis]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {error?.message || "Analysis not found"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The link may have been revoked or the analysis deleted.
              </p>
            </div>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallScore = analysis.overall_score
    ? parseFloat(analysis.overall_score)
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1">
          <Share2 className="h-3 w-3" />
          Shared Analysis
        </Badge>
        {analysis.completed_at && (
          <span className="text-sm text-muted-foreground">
            {new Date(analysis.completed_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold tracking-tight">
        Skill Gap Analysis Results
      </h1>

      {overallScore !== null && (
        <div className="flex justify-center">
          <ScoreGauge score={overallScore} size={200} />
        </div>
      )}

      {analysis.score_breakdown && (
        <ScoreBreakdownCard breakdown={analysis.score_breakdown} />
      )}

      {analysis.skill_gaps && <SkillGapChart gaps={analysis.skill_gaps} />}

      {(analysis.roadmap || analysis.resume_suggestions) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {analysis.roadmap && <RoadmapViewer content={analysis.roadmap} />}
          {analysis.resume_suggestions && (
            <SuggestionsViewer content={analysis.resume_suggestions} />
          )}
        </div>
      )}

      {analysis.github_signals && (
        <GitHubSignals signals={analysis.github_signals} githubUrl={null} />
      )}

      <div className="text-center pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Skill Gap Analyzer
          </Link>
        </p>
      </div>
    </div>
  );
}
