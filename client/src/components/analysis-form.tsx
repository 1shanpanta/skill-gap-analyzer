"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAnalysisPolling } from "@/hooks/useAnalysisPolling";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AnalysisForm() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const { status, isPolling } = useAnalysisPolling(analysisId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resumeText.length < 100) {
      toast.error("Resume must be at least 100 characters");
      return;
    }
    if (jdText.length < 100) {
      toast.error("Job description must be at least 100 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/analyses", {
        method: "POST",
        body: JSON.stringify({
          resume_text: resumeText,
          job_description_text: jdText,
          github_url: githubUrl || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create analysis");
      }

      const data = await res.json();
      setAnalysisId(data.analysis_id);
      toast.success("Analysis started! Processing your data...");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create analysis"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setResumeText("");
    setJdText("");
    setGithubUrl("");
    setAnalysisId(null);
  };

  const isDisabled = isSubmitting || isPolling;

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Analysis</CardTitle>
        <CardDescription>
          Paste your resume and a job description to identify skill gaps and get
          personalized recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show polling status if analysis is in progress */}
        {analysisId && status && (
          <div className="mb-6 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {(status.status === "pending" ||
                status.status === "processing") && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">
                      {status.status === "pending"
                        ? "Queued..."
                        : "Analyzing your data..."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This usually takes 10-30 seconds
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {status.status}
                  </Badge>
                </>
              )}
              {status.status === "completed" && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">Analysis Complete!</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {Number(status.overall_score).toFixed(1)}/100
                    </p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      New Analysis
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/analysis/${analysisId}`}>
                        View Results <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
              {status.status === "failed" && (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">Analysis Failed</p>
                    <p className="text-sm text-muted-foreground">
                      Something went wrong. Please try again.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={resetForm}
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="resume">Resume Text</Label>
              <span
                className={`text-xs ${resumeText.length < 100 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}`}
              >
                {resumeText.length} characters
              </span>
            </div>
            <Textarea
              id="resume"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={isDisabled}
              rows={8}
              className="resize-y"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jd">Job Description</Label>
              <span
                className={`text-xs ${jdText.length < 100 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}`}
              >
                {jdText.length} characters
              </span>
            </div>
            <Textarea
              id="jd"
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              disabled={isDisabled}
              rows={8}
              className="resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub Profile URL (optional)</Label>
            <Input
              id="github"
              type="url"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={isDisabled}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isDisabled}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Analyze Skill Gap"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
