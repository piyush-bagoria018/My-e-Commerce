"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Container } from "../common/Container";
import { SectionHeader } from "../common/SectionHeader";

// Import Swiper styles
import "swiper/css";

const categories = [
  { label: "Men's Lifestyle", icon: "🥼" },
  { label: "Women's Lifestyle", icon: "👠" },
  { label: "Phones", icon: "📱" },
  { label: "Laptops", icon: "💻" },
  { label: "SmartWatch", icon: "⌚" },
  { label: "HeadPhones", icon: "🎧" },
  { label: "Gaming", icon: "🎮" },
  { label: "Electronics", icon: "🔌" },
  { label: "Sports", icon: "⚽" },
  { label: "Home & Lifestyle", icon: "🏠" },
  { label: "Baby & Toys", icon: "🧸" },
  { label: "Health & Beauty", icon: "💄" },
];

export function BrowseCategorySection() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="pt-14">
      <Container>
        <div className="mb-6 flex items-end justify-between gap-4">
          <SectionHeader eyebrow="Categories" title="Browse By Category" />

          {/* Navigation Buttons (Linked to Swiper via Classes) */}
          <div className="flex gap-2">
            <button
              className="category-prev grid h-10 w-10 place-items-center rounded-full border border-border bg-surface transition hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous categories"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.5 12H4M4 12L11 5M4 12L11 19"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="category-next grid h-10 w-10 place-items-center rounded-full border border-border bg-surface transition hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next categories"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 12H20M20 12L13 5M20 12L13 19"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Swiper Container */}
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: ".category-prev",
            nextEl: ".category-next",
          }}
          spaceBetween={16}
          slidesPerView={2} // Mobile default
          breakpoints={{
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 6 }, // Desktop: Your required 6 columns
          }}
          className="pb-4"
        >
          {categories.map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <SwiperSlide key={item.label}>
                <button
                  onClick={() => {
                    setActiveIndex(index);
                    router.push(`/products?category=${encodeURIComponent(item.label)}`);
                  }}
                  className={`w-full rounded-2xl border px-3 py-6 text-center transition-all duration-300 ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-lg shadow-teal-500/20"
                      : "border-border bg-surface text-foreground hover:border-primary hover:shadow-md"
                  }`}
                >
                  <p className="mb-3 text-3xl">{item.icon}</p>
                  <p className="text-sm font-semibold tracking-tight">
                    {item.label}
                  </p>
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </Container>
    </section>
  );
}
