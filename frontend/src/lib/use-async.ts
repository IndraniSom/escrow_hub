"use client";

import { useState, useEffect, useCallback } from "react";
import type { DependencyList } from "react";
import type { AsyncStatus } from "@/components/ui/async-state";

function classifyError(e: unknown): AsyncStatus {
  const status = (e as { status?: number } | null)?.status;
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  return "error";
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
  isEmpty?: (data: T) => boolean,
): { data: T | null; status: AsyncStatus; error: string | null; retry: () => void; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
        setStatus(isEmpty && isEmpty(d) ? "empty" : "success");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
        setStatus(classifyError(e));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((a) => a + 1);
  }, []);

  const refresh = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);

  return { data, status, error, retry, refresh };
}