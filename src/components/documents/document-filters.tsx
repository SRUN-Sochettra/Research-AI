"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("query") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);

  const updateFilters = useCallback(
    (newQuery: string, newSort: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newQuery) {
        params.set("query", newQuery);
      } else {
        params.delete("query");
      }

      if (newSort !== "newest") {
        params.set("sort", newSort);
      } else {
        params.delete("sort");
      }

      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    updateFilters(newQuery, sort);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSort(newSort);
    updateFilters(query, newSort);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          type="search"
          placeholder="Search documents by title..."
          className="border-white/7 bg-white/[0.02] pl-9"
          value={query}
          onChange={handleQueryChange}
        />
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <label
          htmlFor="sort"
          className="text-muted-foreground shrink-0 text-sm"
        >
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={handleSortChange}
          className="ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border border-white/7 bg-white/[0.02] px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-[140px]"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="largest">Largest file</option>
          <option value="smallest">Smallest file</option>
        </select>
      </div>
    </div>
  );
}
