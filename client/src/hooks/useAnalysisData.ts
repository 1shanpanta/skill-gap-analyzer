import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";
import type { AnalysisFull, PaginatedAnalyses } from "@/lib/types";

interface AnalysisStats {
  total: number;
  completed: number;
  average_score: number | null;
  status_counts: Record<string, number>;
}

export function useAnalysisStats() {
  return useSWR<AnalysisStats>("/api/analyses/stats", swrFetcher);
}

export function useRecentAnalyses() {
  return useSWR<PaginatedAnalyses>(
    "/api/analyses?page=1&limit=3",
    swrFetcher
  );
}

export function useAnalyses(
  page: number,
  limit: number,
  params?: { status?: string; sort?: string }
) {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (params?.status && params.status !== "all")
    searchParams.set("status", params.status);
  if (params?.sort && params.sort !== "newest")
    searchParams.set("sort", params.sort);

  return useSWR<PaginatedAnalyses>(
    `/api/analyses?${searchParams}`,
    swrFetcher
  );
}

export function useAnalysis(id: string | null) {
  return useSWR<AnalysisFull>(id ? `/api/analyses/${id}` : null, swrFetcher);
}
