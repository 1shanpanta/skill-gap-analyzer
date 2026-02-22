"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";

interface PollStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  overall_score: string | null;
  completed_at: string | null;
}

export function useAnalysisPolling(analysisId: string | null) {
  const [status, setStatus] = useState<PollStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!analysisId) return;

    try {
      const res = await apiFetch(`/api/analyses/${analysisId}/status`);
      if (!res.ok) return;
      const data: PollStatus = await res.json();
      setStatus(data);

      if (data.status === "completed" || data.status === "failed") {
        stopPolling();
      }
    } catch {
      // Silently retry on network errors
    }
  }, [analysisId, stopPolling]);

  useEffect(() => {
    if (!analysisId) return;

    setIsPolling(true);
    poll(); // Immediate first poll

    intervalRef.current = setInterval(poll, 2000); // Poll every 2 seconds

    return () => {
      stopPolling();
    };
  }, [analysisId, poll, stopPolling]);

  return { status, isPolling, stopPolling };
}
