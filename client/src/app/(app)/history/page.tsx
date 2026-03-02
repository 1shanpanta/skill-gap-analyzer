"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { AnalysisSummary, PaginatedAnalyses } from "@/lib/types";
import { AnalysisCard } from "@/components/analysis-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FileSearch } from "lucide-react";

const LIMIT = 10;

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / LIMIT);

  const fetchAnalyses = useCallback(async (currentPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/analyses?page=${currentPage}&limit=${LIMIT}`);

      if (!res.ok) {
        throw new Error("Failed to load analyses. Please try again.");
      }

      const data: PaginatedAnalyses = await res.json();
      setAnalyses(data.analyses);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses(page);
  }, [fetchAnalyses, page]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const rangeStart = (page - 1) * LIMIT + 1;
  const rangeEnd = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analysis History
          </h1>
          <p className="text-muted-foreground mt-2">
            All your past runs in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading analyses...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <FileSearch className="h-6 w-6 text-destructive" />
          </div>
          <p className="mt-4 text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchAnalyses(page)}
          >
            Try Again
          </Button>
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-3">
            <FileSearch className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Nothing here yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Once you run your first analysis, it&apos;ll show up here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">
              <Plus className="mr-2 h-4 w-4" />
              Run your first one
            </Link>
          </Button>
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
              <AnalysisCard key={analysis.id} analysis={analysis} />
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
