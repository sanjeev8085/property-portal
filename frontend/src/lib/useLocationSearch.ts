"use client";
import { useState, useEffect, useRef } from "react";

const LOCATIONS: string[] = [
  "Arera Colony, Bhopal",
  "MP Nagar, Bhopal",
  "Kolar Road, Bhopal",
  "Shahpura, Bhopal",
  "Hoshangabad Road, Bhopal",
  "Ayodhya Bypass, Bhopal",
  "Vijay Nagar, Indore",
  "Palasia, Indore",
  "Nipania, Indore",
  "Rau, Indore",
  "Rajwada, Indore",
  "Malviya Nagar, Jaipur",
  "Vaishali Nagar, Jaipur",
  "C-Scheme, Jaipur",
  "Mansarovar, Jaipur",
  "Koregaon Park, Pune",
  "Kothrud, Pune",
  "Baner, Pune",
  "Wakad, Pune",
  "Andheri West, Mumbai",
  "Powai, Mumbai",
  "Borivali, Mumbai",
  "Thane West, Mumbai",
  "Indiranagar, Bengaluru",
  "Koramangala, Bengaluru",
  "Whitefield, Bengaluru",
  "HSR Layout, Bengaluru",
  "Hitech City, Hyderabad",
  "Banjara Hills, Hyderabad",
  "Gachibowli, Hyderabad",
  "Sector 62, Noida",
  "Sector 18, Noida",
  "Dwarka, Delhi",
  "Rohini, Delhi",
  "Lajpat Nagar, Delhi",
  "Salt Lake, Kolkata",
  "Alipore, Kolkata",
  "Anna Nagar, Chennai",
  "Velachery, Chennai",
  "Adyar, Chennai",
];

export interface UseLocationSearchResult {
  query: string;
  setQuery: (q: string) => void;
  suggestions: string[];
  isOpen: boolean;
  selectSuggestion: (loc: string) => void;
  clear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useLocationSearch(
  initialValue = "",
  onSelect?: (loc: string) => void,
  debounceMs = 180
): UseLocationSearchResult {
  const [query, setQueryState] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      const q = query.toLowerCase();
      const matches = LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(q)
      ).slice(0, 7);
      setSuggestions(matches);
      setIsOpen(matches.length > 0);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, debounceMs]);

  const setQuery = (q: string) => {
    setQueryState(q);
  };

  const selectSuggestion = (loc: string) => {
    setQueryState(loc);
    setSuggestions([]);
    setIsOpen(false);
    onSelect?.(loc);
  };

  const clear = () => {
    setQueryState("");
    setSuggestions([]);
    setIsOpen(false);
  };

  return { query, setQuery, suggestions, isOpen, selectSuggestion, clear, inputRef };
}
