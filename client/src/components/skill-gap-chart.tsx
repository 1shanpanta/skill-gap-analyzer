"use client";

import type { SkillGaps } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SkillGapChartProps {
  gaps: SkillGaps;
}

interface SkillSection {
  title: string;
  skills: string[];
  className: string;
}

function getMatchStrengthColor(strength: string): string {
  switch (strength.toLowerCase()) {
    case "strong":
      return "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "moderate":
      return "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "weak":
      return "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400";
    default:
      return "border-muted bg-muted/50 text-muted-foreground";
  }
}

export function SkillGapChart({ gaps }: SkillGapChartProps) {
  const sections: SkillSection[] = [
    {
      title: "Matched Skills",
      skills: gaps.matchedSkills ?? [],
      className:
        "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Missing Required",
      skills: gaps.missingRequired ?? [],
      className:
        "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
    },
    {
      title: "Missing Preferred",
      skills: gaps.missingPreferred ?? [],
      className:
        "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    {
      title: "Extra Skills",
      skills: gaps.extraSkills ?? [],
      className:
        "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
  ];

  const partialMatches = gaps.partialMatches ?? [];
  const hasAnySections =
    sections.some((s) => s.skills.length > 0) || partialMatches.length > 0;

  if (!hasAnySections) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skill Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map(
          (section) =>
            section.skills.length > 0 && (
              <div key={section.title} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {section.title}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({section.skills.length})
                  </span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {section.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className={section.className}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )
        )}

        {partialMatches.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              Partial Matches
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({partialMatches.length})
              </span>
            </h4>
            <div className="space-y-2">
              {partialMatches.map((match) => (
                <div
                  key={match.skill}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <Badge
                    variant="outline"
                    className={getMatchStrengthColor(match.matchStrength)}
                  >
                    {match.skill}
                  </Badge>
                  <span className="text-muted-foreground">
                    You have{" "}
                    <span className="font-medium text-foreground">
                      {match.candidateHas}
                    </span>
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {match.matchStrength}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
