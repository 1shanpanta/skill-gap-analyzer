"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SSEStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  overall_score: string | null;
  completed_at: string | null;
}

/**
 * Connects to the SSE stream for real-time analysis status updates.
 * Falls back to polling if SSE is not supported or fails.
 */
export function useAnalysisSSE(analysisId: string | null) {
  const [status, setStatus] = useState<SSEStatus | null>(null);
  const [isActive, setIsActive] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (fallbackRef.current) {
      clearInterval(fallbackRef.current);
      fallbackRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (!analysisId) {
      cleanup();
      return;
    }

    setIsActive(true);

    // Try SSE first
    try {
      const es = new EventSource(`/api/analyses/${analysisId}/stream`, {
        withCredentials: true,
      });
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data: SSEStatus = JSON.parse(event.data);
          setStatus(data);

          if (data.status === "completed" || data.status === "failed") {
            cleanup();
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        // SSE failed — fall back to polling
        es.close();
        eventSourceRef.current = null;
        startPollingFallback(analysisId);
      };
    } catch {
      // EventSource not supported — fall back to polling
      startPollingFallback(analysisId);
    }

    function startPollingFallback(id: string) {
      if (fallbackRef.current) return; // already polling

      async function poll() {
        try {
          const res = await fetch(`/api/analyses/${id}/status`, {
            credentials: "include",
          });
          if (!res.ok) return;
          const data: SSEStatus = await res.json();
          setStatus(data);

          if (data.status === "completed" || data.status === "failed") {
            cleanup();
          }
        } catch {
          // Silently retry
        }
      }

      poll(); // immediate
      fallbackRef.current = setInterval(poll, 2000);
    }

    return () => {
      cleanup();
    };
  }, [analysisId, cleanup]);

  return { status, isActive };
}
