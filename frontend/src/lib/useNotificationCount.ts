"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const POLL_INTERVAL_MS = 30_000;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface UseNotificationCountResult {
  count: number;
  markAllRead: () => Promise<void>;
  isLoading: boolean;
}

export function useNotificationCount(): UseNotificationCountResult {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setCount(0);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/v1/notifications?unread_only=true&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      // Backend returns { items: [...], total: N } or array
      const total =
        typeof data?.total === "number"
          ? data.total
          : Array.isArray(data)
          ? data.length
          : 0;
      setCount(total);
    } catch {
      // silently fail — don't disturb UX for background polling
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    timerRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchCount]);

  const markAllRead = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/v1/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCount(0);
    } catch {
      // ignore
    }
  }, []);

  return { count, markAllRead, isLoading };
}
