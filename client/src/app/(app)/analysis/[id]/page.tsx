"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { AnalysisFull } from "@/lib/types";
import { useAnalysisPolling } from "@/hooks/useAnalysisPolling";
import { ScoreGauge } from "@/components/score-gauge";
import { ScoreBreakdownCard } from "@/components/score-breakdown";
import { SkillGapChart } from "@/components/skill-gap-chart";
import { RoadmapViewer } from "@/components/roadmap-viewer";
import { SuggestionsViewer } from "@/components/suggestions-viewer";
import { GitHubSignals } from "@/components/github-signals";
import { TokenUsage } from "@/components/token-usage";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; analysis: AnalysisFull };

export default function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ kind: "loading" });

  // Determine if we need polling (pending/processing)
  const needsPolling =
    state.kind === "loaded" &&
    (state.analysis.status === "pending" ||
      state.analysis.status === "processing");

  const { status: pollStatus } = useAnalysisPolling(
    needsPolling ? params.id : null
  );

  // Fetch analysis data
  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await apiFetch(`/api/analyses/${params.id}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            errorData?.message ?? `Failed to load analysis (${res.status})`
          );
        }

        const data: AnalysisFull = await res.json();
        setState({ kind: "loaded", analysis: data });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setState({ kind: "error", message });
        toast.error(message);
      }
    }

    fetchAnalysis();
  }, [params.id]);

  // When polling detects completion or failure, re-fetch full data
  useEffect(() => {
    if (!pollStatus) return;

    if (
      pollStatus.status === "completed" ||
      pollStatus.status === "failed"
    ) {
      async function refetch() {
        try {
          const res = await apiFetch(`/api/analyses/${params.id}`);
          if (res.ok) {
            const data: AnalysisFull = await res.json();
            setState({ kind: "loaded", analysis: data });
          }
        } catch {
          // Ignore refetch errors
        }
      }
      refetch();
    }
  }, [pollStatus, params.id]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {state.kind === "loading" && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading analysis results...
          </p>
        </div>
      )}

      {/* Error */}
      {state.kind === "error" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Failed to load analysis
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.message}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loaded */}
      {state.kind === "loaded" && (
        <AnalysisContent analysis={state.analysis} />
      )}
    </div>
  );
}

function AnalysisContent({ analysis }: { analysis: AnalysisFull }) {
  const router = useRouter();

  // Pending / Processing
  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <div className="relative">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <RefreshCw className="absolute -bottom-1 -right-1 h-4 w-4 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Analysis in Progress
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {analysis.status === "pending"
                ? "Your analysis is queued and will begin shortly..."
                : "Analyzing your resume against the job description..."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking for updates automatically
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed
  if (analysis.status === "failed") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Analysis Failed
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Something went wrong while processing your analysis. Please try
              again.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Completed
  const overallScore = analysis.overall_score
    ? parseFloat(analysis.overall_score)
    : null;

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Analysis Results
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed{" "}
          {analysis.completed_at
            ? new Date(analysis.completed_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "recently"}
        </p>
      </div>

      {/* Score gauge */}
      {overallScore !== null && (
        <div className="flex justify-center">
          <ScoreGauge score={overallScore} size={200} />
        </div>
      )}

      {/* Score breakdown */}
      {analysis.score_breakdown && (
        <ScoreBreakdownCard breakdown={analysis.score_breakdown} />
      )}

      {/* Skill gap chart */}
      {analysis.skill_gaps && <SkillGapChart gaps={analysis.skill_gaps} />}

      {/* Roadmap and Resume Suggestions — two columns on desktop */}
      {(analysis.roadmap || analysis.resume_suggestions) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {analysis.roadmap && (
            <RoadmapViewer
              content={analysis.roadmap}
              actions={<CopyButton text={analysis.roadmap} label="Copy" />}
            />
          )}
          {analysis.resume_suggestions && (
            <SuggestionsViewer
              content={analysis.resume_suggestions}
              actions={
                <CopyButton text={analysis.resume_suggestions} label="Copy" />
              }
            />
          )}
        </div>
      )}

      {/* GitHub signals */}
      {analysis.github_signals && (
        <GitHubSignals
          signals={analysis.github_signals}
          githubUrl={analysis.github_url}
        />
      )}

      {/* Token usage */}
      {analysis.token_usage && <TokenUsage usage={analysis.token_usage} />}
    </div>
  );
}
