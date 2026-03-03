"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAnalyses } from "@/hooks/useAnalysisData";
import { AnalysisCard } from "@/components/analysis-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileSearch, X, GitCompareArrows, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const LIMIT = 10;

interface Filters {
  status: string;
  sort: string;
}

const defaultFilters: Filters = { status: "all", sort: "newest" };

export default function HistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const { data, isLoading, error, mutate } = useAnalyses(page, LIMIT, filters);

  const analyses = data?.analyses ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const hasActiveFilters =
    filters.status !== "all" || filters.sort !== "newest";

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateFilter(key: keyof Filters, value: string) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(defaultFilters);
  }

  function toggleCompareId(id: string) {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev
    );
  }

  const rangeStart = (page - 1) * LIMIT + 1;
  const rangeEnd = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analysis History
          </h1>
          <p className="text-muted-foreground mt-2">
            All your past runs in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await apiFetch("/api/analyses/export?format=csv");
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "analyses.csv";
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                toast.error("Failed to export CSV");
              }
            }}
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Plus className="mr-2 h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.status}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => updateFilter("sort", v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="score_desc">Highest score</SelectItem>
            <SelectItem value="score_asc">Lowest score</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}

        <div className="ml-auto">
          <Button
            variant={compareMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareIds([]);
            }}
          >
            <GitCompareArrows className="mr-1 h-4 w-4" />
            {compareMode ? "Cancel" : "Compare"}
          </Button>
        </div>
      </div>

      {/* Compare action bar */}
      {compareMode && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
          <span className="text-muted-foreground">
            Select 2 completed analyses to compare ({compareIds.length}/2
            selected)
          </span>
          {compareIds.length === 2 && (
            <Button
              size="sm"
              onClick={() =>
                router.push(`/compare?ids=${compareIds.join(",")}`)
              }
            >
              Compare Now
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <FileSearch className="h-6 w-6 text-destructive" />
          </div>
          <p className="mt-4 text-sm font-medium text-destructive">
            Failed to load analyses. Please try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => mutate()}
          >
            Try Again
          </Button>
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-3">
            <FileSearch className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {hasActiveFilters ? "No matching analyses" : "Nothing here yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : "Once you run your first analysis, it'll show up here."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button asChild className="mt-4">
              <Link href="/dashboard">
                <Plus className="mr-2 h-4 w-4" />
                Run your first one
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} analyses
            </p>
          </div>

          <div className="space-y-3">
            {analyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                onDeleted={() => mutate()}
                compareMode={compareMode}
                isSelected={compareIds.includes(analysis.id)}
                onToggleCompare={toggleCompareId}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
