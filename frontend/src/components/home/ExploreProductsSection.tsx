"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Container } from "../common/Container";
import { ProductCard } from "../product/ProductCard";
import { getAllProducts } from "@/services/product.service";
import type { Product } from "@/types/product";

export function ExploreProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const allProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);
  }, [products]);

  return (
    <section className="pt-14">
      <Container>
        {/* Section header row with arrow controls on the right */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-accent">
              <span className="inline-block h-5 w-1.5 rounded-full bg-accent" />
              Our Products
            </p>
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Explore Our Products
            </h2>
          </div>
        </div>

        {/* Product grid — 2 rows × 4 columns */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`home-explore-loading-${idx}`}
                className="h-72 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : null}

        {!loading && allProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {allProducts.map((item) => (
              <ProductCard
                key={item._id}
                title={item.name}
                price={item.price}
                originalPrice={Math.round(item.price * 1.18)}
                rating={item.ratings || 0}
                reviews={Math.max(8, Math.round((item.ratings || 0) * 24))}
                imageLabel={item.category}
                imageUrl={item.productImages?.[0]}
                href={`/products/${item._id}`}
                badge={new Date(item.createdAt || 0).getTime() > Date.now() - 14 * 86400000 ? "New" : undefined}
              />
            ))}
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-block rounded-full bg-primary px-10 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong"
          >
            View All Products
          </Link>
        </div>
      </Container>
    </section>
  );
}
