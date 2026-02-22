"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, Coins } from "lucide-react";

interface TokenUsageProps {
  usage: Record<string, unknown> | null;
}

interface SubCategory {
  label: string;
  tokens: number;
}

function parseSubCategories(usage: Record<string, unknown>): SubCategory[] {
  const subs: SubCategory[] = [];
  const skipKeys = new Set(["total_tokens", "estimated_cost"]);

  for (const [key, value] of Object.entries(usage)) {
    if (skipKeys.has(key)) continue;

    // Handle nested objects with their own total_tokens
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      const tokens = typeof nested.total_tokens === "number" ? nested.total_tokens : 0;
      if (tokens > 0) {
        subs.push({
          label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          tokens,
        });
      }
    }

    // Handle direct numeric values (e.g. { roadmap: 1500, resume_suggestions: 800 })
    if (typeof value === "number" && value > 0) {
      subs.push({
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        tokens: value,
      });
    }
  }

  return subs;
}

export function TokenUsage({ usage }: TokenUsageProps) {
  const [expanded, setExpanded] = useState(false);

  if (!usage) return null;

  const totalTokens =
    typeof usage.total_tokens === "number" ? usage.total_tokens : 0;
  const estimatedCost =
    typeof usage.estimated_cost === "number" ? usage.estimated_cost : null;

  if (totalTokens === 0) return null;

  const subCategories = parseSubCategories(usage);

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 px-4">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Coins className="h-4 w-4" />
            Token Usage
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{totalTokens.toLocaleString()} tokens</span>
            {estimatedCost !== null && (
              <span>${estimatedCost.toFixed(4)}</span>
            )}
            {subCategories.length > 0 &&
              (expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              ))}
          </div>
        </button>
      </CardHeader>
      {expanded && subCategories.length > 0 && (
        <CardContent className="px-4 pb-3 pt-0">
          <div className="space-y-1.5 border-t pt-3">
            {subCategories.map((sub) => (
              <div
                key={sub.label}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>{sub.label}</span>
                <span>{sub.tokens.toLocaleString()} tokens</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
