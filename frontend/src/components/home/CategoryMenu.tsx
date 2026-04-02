"use client";

import { useRouter } from "next/navigation";

const categories = [
  "Men's Lifestyle",
  "Women's Lifestyle",
  "Electronics",
  "Home & Lifestyle",
  "Sports",
  "Baby & Toys",
  "Health & Beauty",
];

export function CategoryMenu() {
  const router = useRouter();

  return (
    <aside className="rounded-2xl p-1">
      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category}>
            <button
              type="button"
              onClick={() =>
                router.push(`/products?category=${encodeURIComponent(category)}`)
              }
              className="w-full text-left text-base text-foreground/80 transition hover:text-primary"
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}