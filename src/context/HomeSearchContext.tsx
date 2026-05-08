"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type HomeSearchValue = {
  query: string;
  setQuery: (q: string) => void;
};

const HomeSearchContext = createContext<HomeSearchValue | null>(null);

export function HomeSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <HomeSearchContext.Provider value={value}>{children}</HomeSearchContext.Provider>;
}

export function useHomeSearch() {
  const ctx = useContext(HomeSearchContext);
  if (!ctx) {
    return { query: "", setQuery: (_q: string) => {} };
  }
  return ctx;
}
