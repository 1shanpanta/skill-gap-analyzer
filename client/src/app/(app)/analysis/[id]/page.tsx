"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { AnalysisFull } from "@/lib/types";
import { useAnalysis } from "@/hooks/useAnalysisData";
import { useAnalysisSSE } from "@/hooks/useAnalysisSSE";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ScoreGauge } from "@/components/score-gauge";
import { ScoreBreakdownCard } from "@/components/score-breakdown";
import { SkillGapChart } from "@/components/skill-gap-chart";
import { RoadmapViewer } from "@/components/roadmap-viewer";
import { SuggestionsViewer } from "@/components/suggestions-viewer";
import { GitHubSignals } from "@/components/github-signals";
import { TokenUsage } from "@/components/token-usage";
import { AnalysisNotes } from "@/components/analysis-notes";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  AlertTriangle,
  Clock,
  Download,
  Link2,
  Link2Off,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; analysis: AnalysisFull };

export default function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: analysis, error: swrError, isLoading, mutate } = useAnalysis(params.id);

  // Determine if we need polling (pending/processing)
  const needsPolling =
    analysis &&
    (analysis.status === "pending" || analysis.status === "processing");

  const { status: pollStatus } = useAnalysisSSE(
    needsPolling ? params.id : null
  );

  // Track completion in posthog
  useEffect(() => {
    if (analysis?.status === "completed") {
      posthog.capture("analysis_completed", {
        analysis_id: analysis.id,
        score: analysis.overall_score ? parseFloat(analysis.overall_score) : null,
      });
    }
  }, [analysis?.status, analysis?.id, analysis?.overall_score]);

  // When polling detects completion or failure, re-fetch full data
  useEffect(() => {
    if (!pollStatus) return;
    if (pollStatus.status === "completed" || pollStatus.status === "failed") {
      mutate();
    }
  }, [pollStatus, mutate]);

  // Map SWR state to the original PageState for rendering
  const state: PageState = isLoading
    ? { kind: "loading" }
    : swrError
      ? { kind: "error", message: swrError instanceof Error ? swrError.message : "An unexpected error occurred" }
      : analysis
        ? { kind: "loaded", analysis }
        : { kind: "loading" };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "History", href: "/history" },
          { label: `Analysis #${params.id.slice(0, 8)}` },
        ]}
      />

      {/* Loading */}
      {state.kind === "loading" && (
        <div className="space-y-8">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
          <div className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
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
        <AnalysisContent
          analysis={state.analysis}
          onUpdate={(a) => mutate(a, false)}
        />
      )}
    </div>
  );
}

function ExportPDFButton({ analysis }: { analysis: AnalysisFull }) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { AnalysisPDF } = await import("@/components/analysis-pdf");
      const blob = await pdf(<AnalysisPDF analysis={analysis} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-${analysis.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      posthog.capture("pdf_exported", { analysis_id: analysis.id });
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      Export PDF
    </Button>
  );
}

function DeleteAnalysisButton({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/analyses/${analysisId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete");
      }
      posthog.capture("analysis_deleted", { analysis_id: analysisId });
      toast.success("Analysis deleted");
      router.push("/history");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete analysis"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this analysis and its results. This action cannot be undone.
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
  );
}

function FailedAnalysisCard({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    setIsRetrying(true);
    try {
      const res = await apiFetch(`/api/analyses/${analysisId}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to retry");
      }
      toast.success("Analysis requeued");
      // Reload the page to pick up the new pending status
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to retry analysis"
      );
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Analysis Failed
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong while processing your analysis.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-4 w-4" />
            )}
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ShareButton({ analysis, onUpdate }: { analysis: AnalysisFull; onUpdate: (a: AnalysisFull) => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const isShared = !!analysis.share_token;
  const shareUrl = isShared
    ? `${window.location.origin}/shared/${analysis.share_token}`
    : null;

  async function handleToggle() {
    setIsLoading(true);
    try {
      if (isShared) {
        const res = await apiFetch(`/api/analyses/${analysis.id}/share`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to revoke share link");
        onUpdate({ ...analysis, share_token: null });
        toast.success("Share link revoked");
      } else {
        const res = await apiFetch(`/api/analyses/${analysis.id}/share`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to create share link");
        const data = await res.json();
        onUpdate({ ...analysis, share_token: data.share_token });
        posthog.capture("share_link_generated", { analysis_id: analysis.id });
        toast.success("Share link created");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update share");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <div className="flex items-center gap-1">
      {isShared && (
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Link2 className="mr-1 h-4 w-4" />
          Copy Link
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={isShared ? "text-destructive hover:text-destructive" : ""}
      >
        {isLoading ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : isShared ? (
          <Link2Off className="mr-1 h-4 w-4" />
        ) : (
          <Link2 className="mr-1 h-4 w-4" />
        )}
        {isShared ? "Unshare" : "Share"}
      </Button>
    </div>
  );
}

function AnalysisContent({ analysis, onUpdate }: { analysis: AnalysisFull; onUpdate: (a: AnalysisFull) => void }) {
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
    return <FailedAnalysisCard analysisId={analysis.id} />;
  }

  // Completed
  const overallScore = analysis.overall_score
    ? parseFloat(analysis.overall_score)
    : null;

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex items-start justify-between">
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
        <div className="flex flex-wrap gap-2">
          <ShareButton analysis={analysis} onUpdate={onUpdate} />
          <ExportPDFButton analysis={analysis} />
          <DeleteAnalysisButton analysisId={analysis.id} />
        </div>
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

      {/* Roadmap + Recommended Projects */}
      {analysis.roadmap && (
        <RoadmapViewer
          content={analysis.roadmap}
          actions={<CopyButton text={analysis.roadmap} label="Copy" />}
        />
      )}

      {/* Resume Suggestions */}
      {analysis.resume_suggestions && (
        <SuggestionsViewer
          content={analysis.resume_suggestions}
          actions={
            <CopyButton text={analysis.resume_suggestions} label="Copy" />
          }
        />
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

      {/* Notes */}
      <AnalysisNotes analysisId={analysis.id} />
    </div>
  );
}
