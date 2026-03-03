"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { parseResumeFile } from "@/lib/parse-resume";
import { useAnalysisSSE } from "@/hooks/useAnalysisSSE";
import type { SavedResume } from "@/lib/types";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Upload,
  FileText,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { posthog } from "@/lib/posthog";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AnalysisForm() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [saveResume, setSaveResume] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  const { status, isActive: isPolling } = useAnalysisSSE(analysisId);

  const fetchSavedResumes = useCallback(async () => {
    try {
      const res = await apiFetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setSavedResumes(data.resumes);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchSavedResumes();
  }, [fetchSavedResumes]);

  const isUsingSavedResume = selectedResumeId !== "" && selectedResumeId !== "new";

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      toast.error("Only PDF, DOCX, and TXT files are supported.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 10 MB.");
      return false;
    }
    return true;
  }

  async function processFile(file: File) {
    if (!validateFile(file)) return;

    setIsParsing(true);
    try {
      const text = await parseResumeFile(file);
      if (!text.trim()) {
        toast.error("Couldn't extract any text from that file.");
        return;
      }
      setResumeText(text);
      setResumeFile(file.name);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to read file"
      );
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  function clearFile() {
    setResumeFile(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingRef.current) return;

    if (!isUsingSavedResume && resumeText.length < 100) {
      toast.error("Resume must be at least 100 characters");
      return;
    }
    if (jdText.length < 100) {
      toast.error("Job description must be at least 100 characters");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        job_description_text: jdText,
        github_url: githubUrl || undefined,
      };

      if (isUsingSavedResume) {
        payload.resume_id = selectedResumeId;
      } else {
        payload.resume_text = resumeText;
        if (saveResume) {
          payload.save_resume = true;
          if (resumeName.trim()) payload.resume_name = resumeName.trim();
        }
      }

      const res = await apiFetch("/api/analyses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) {
          toast.error(err.message || "No credits remaining", {
            action: {
              label: "Buy credits",
              onClick: () => router.push("/pricing"),
            },
          });
          return;
        }
        throw new Error(err.message || "Failed to create analysis");
      }

      const data = await res.json();
      setAnalysisId(data.analysis_id);
      posthog.capture("analysis_started", {
        cached: !!data.cached,
        used_saved_resume: isUsingSavedResume,
        has_github: !!githubUrl,
      });
      if (data.cached) {
        toast.success("Found a cached result from the last 24 hours.");
      } else {
        toast.success("Analysis started — hang tight.");
      }
      if (saveResume) fetchSavedResumes();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create analysis"
      );
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const resetForm = () => {
    setResumeText("");
    setJdText("");
    setGithubUrl("");
    setAnalysisId(null);
    setResumeFile(null);
    setSelectedResumeId("");
    setSaveResume(false);
    setResumeName("");
  };

  const isDisabled = isSubmitting || isPolling;

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Analysis</CardTitle>
        <CardDescription>
          Paste your resume and a job posting to see how they compare.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show polling status if analysis is in progress */}
        {analysisId && status && (
          <div className="mb-6 rounded-lg border p-4" aria-live="polite" role="status">
            <div className="flex items-center gap-3">
              {(status.status === "pending" ||
                status.status === "processing") && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">
                      {status.status === "pending"
                        ? "Queued..."
                        : "Analyzing..."}
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
                    <p className="font-medium">Done!</p>
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
                    <p className="font-medium">Something went wrong</p>
                    <p className="text-sm text-muted-foreground">
                      Try again or paste different content.
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
              <Label htmlFor="resume">Resume</Label>
              {!isUsingSavedResume && (
                <span
                  className={`text-xs ${resumeText.length < 100 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}`}
                >
                  {resumeText.length} characters
                </span>
              )}
            </div>

            {/* Saved resume selector */}
            {savedResumes.length > 0 && (
              <Select
                value={selectedResumeId}
                onValueChange={(v) => {
                  setSelectedResumeId(v);
                  if (v !== "" && v !== "new") {
                    setSaveResume(false);
                  }
                }}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved resume or paste new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Paste new resume</SelectItem>
                  {savedResumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({r.analysis_count} analyses)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {isUsingSavedResume && (
              <p className="text-sm text-muted-foreground">
                Using saved resume: {savedResumes.find((r) => r.id === selectedResumeId)?.name}
              </p>
            )}

            {/* File upload + textarea — only show when not using saved resume */}
            {!isUsingSavedResume && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isDisabled || isParsing}
                  className="hidden"
                  id="resume-file"
                />

                {resumeFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed p-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{resumeFile}</span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="ml-auto rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="resume-file"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
                      isDragging && "border-primary bg-primary/5 text-foreground"
                    )}
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Reading file...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>
                          {isDragging
                            ? "Drop your file here"
                            : "Drag & drop or click to upload"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PDF, DOCX, or TXT (max 10 MB)
                        </span>
                      </>
                    )}
                  </label>
                )}

                <Textarea
                  id="resume"
                  placeholder="Or paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  disabled={isDisabled}
                  rows={8}
                  className="resize-y"
                />

                {/* Save resume option */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-resume"
                    checked={saveResume}
                    onCheckedChange={(checked) => setSaveResume(checked === true)}
                    disabled={isDisabled}
                  />
                  <label htmlFor="save-resume" className="text-sm text-muted-foreground cursor-pointer">
                    <Save className="mr-1 inline h-3.5 w-3.5" />
                    Save this resume for future analyses
                  </label>
                </div>

                {saveResume && (
                  <Input
                    placeholder='Resume name (e.g. "Software Engineer Resume")'
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    disabled={isDisabled}
                  />
                )}
              </>
            )}
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
              "Run Analysis"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
