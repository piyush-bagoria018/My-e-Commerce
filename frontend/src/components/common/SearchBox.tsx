"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();

    if (!nextQuery) {
      router.push("/products");
      return;
    }

    router.push(`/products?search=${encodeURIComponent(nextQuery)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full sm:max-w-xs">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products"
        className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none placeholder:text-muted focus:border-primary"
      />
    </form>
  );
}