"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink } from "lucide-react";

interface GitHubSignalsProps {
  signals: Record<string, unknown> | null;
  githubUrl: string | null;
}

const SIGNAL_LABELS: Record<string, string> = {
  public_repos: "Public Repositories",
  total_stars: "Total Stars",
  top_languages: "Top Languages",
  recent_activity_score: "Recent Activity",
  contribution_streak: "Contribution Streak",
  profile_completeness: "Profile Completeness",
};

function formatValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return "N/A";

  // Arrays (e.g. top_languages) render as badges
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {String(item)}
          </Badge>
        ))}
      </div>
    );
  }

  // Scores with /100
  if (
    typeof value === "number" &&
    (key.includes("score") || key.includes("completeness"))
  ) {
    return `${value}/100`;
  }

  // Contribution streak (days)
  if (typeof value === "number" && key.includes("streak")) {
    return `${value.toLocaleString()} days`;
  }

  // Numbers with commas
  if (typeof value === "number") {
    return value.toLocaleString();
  }

  return String(value);
}

export function GitHubSignals({ signals, githubUrl }: GitHubSignalsProps) {
  if (!signals) return null;

  const entries = Object.entries(signals).filter(
    ([, value]) => value !== null && value !== undefined
  );

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Github className="h-5 w-5 text-muted-foreground" />
            GitHub Analysis
          </CardTitle>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View Profile
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {SIGNAL_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              <div className="text-sm font-semibold text-foreground">
                {formatValue(key, value)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
