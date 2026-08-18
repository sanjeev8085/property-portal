"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "aura_favorites";

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeFavorites(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export interface UseFavoritesResult {
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (id: string | number, title?: string) => void;
  favorites: string[];
}

export function useFavorites(): UseFavoritesResult {
  const [ids, setIds] = useState<Set<string>>(new Set());

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setIds(readFavorites());
  }, []);

  const isFavorite = useCallback(
    (id: string | number) => ids.has(String(id)),
    [ids]
  );

  const toggleFavorite = useCallback(
    (id: string | number, _title?: string) => {
      const key = String(id);
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        writeFavorites(next);
        return next;
      });
      // API-ready: uncomment when backend supports saved listings
      // const token = localStorage.getItem("access_token");
      // if (token) fetch(`/api/v1/properties/${id}/save`, { method: "POST", ... });
    },
    []
  );

  return {
    isFavorite,
    toggleFavorite,
    favorites: [...ids],
  };
}
