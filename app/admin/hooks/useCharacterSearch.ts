"use client";

import { useRef, useState } from "react";
import { EpgpSearchResult } from "../types";

/** Sugerencias del roster EPGP (main o alter) para los campos de personaje. */
export function useCharacterSearch(max = 6) {
  const [results, setResults] = useState<EpgpSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const lastQuery = useRef("");

  const search = async (q: string) => {
    lastQuery.current = q;
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/epgp/search?q=${encodeURIComponent(q)}`);
      if (res.ok && lastQuery.current === q) {
        const data: EpgpSearchResult[] = await res.json();
        setResults(data.slice(0, max));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search, clear: () => setResults([]) };
}
