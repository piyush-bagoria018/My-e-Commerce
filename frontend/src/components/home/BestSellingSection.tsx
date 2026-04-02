"use client";

import { useEffect, useMemo, useState } from "react";
import { Container } from "../common/Container";
import { SectionHeader } from "../common/SectionHeader";
import { ProductCard } from "../product/ProductCard";
import { getAllProducts } from "@/services/product.service";
import type { Product } from "@/types/product";

export function BestSellingSection() {
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

  const bestSellingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.ratings || 0) - (a.ratings || 0))
      .slice(0, 4);
  }, [products]);

  return (
    <section className="pt-14">
      <Container>
        <SectionHeader
          eyebrow="This Month"
          title="Best Selling Products"
          actionLabel="View All"
          actionHref="/products"
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`home-best-loading-${idx}`}
                className="h-72 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : null}

        {!loading && bestSellingProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {bestSellingProducts.map((item) => (
              <ProductCard
                key={item._id}
                title={item.name}
                price={item.price}
                originalPrice={Math.round(item.price * 1.15)}
                rating={item.ratings || 0}
                reviews={Math.max(8, Math.round((item.ratings || 0) * 25))}
                imageLabel={item.category}
                imageUrl={item.productImages?.[0]}
                href={`/products/${item._id}`}
              />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}