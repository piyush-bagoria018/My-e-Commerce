"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "../common/Container";
import { SectionHeader } from "../common/SectionHeader";
import { ProductCard } from "../product/ProductCard";
import { getAllProducts } from "@/services/product.service";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "@/services/wishlist.service";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Product } from "@/types/product";

const SALE_DURATION_MS =
  3 * 2 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 19 * 60 * 1000 + 56 * 1000;

type CountdownValue = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function getCountdownValue(targetTime: number): CountdownValue {
  const now = Date.now();
  const remaining = Math.max(targetTime - now, 0);

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function FlashSalesSection() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [targetTime] = useState(() => Date.now() + SALE_DURATION_MS);
  const [timer, setTimer] = useState<CountdownValue>(() => getCountdownValue(targetTime));
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(getCountdownValue(targetTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      setWishlistIds([]);
      return;
    }

    const loadWishlist = async () => {
      try {
        const data = await getWishlist();
        setWishlistIds(data.products.map((item) => item._id));
      } catch {
        setWishlistIds([]);
      }
    };

    loadWishlist();
  }, [isAuthenticated, isLoading]);

  const handleToggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      setBusyProductId(productId);
      const isSaved = wishlistIds.includes(productId);

      if (isSaved) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => [...prev, productId]);
      }
    } finally {
      setBusyProductId(null);
    }
  };

  const flashProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 4);
  }, [products]);

  const countdown = [
    { label: "Days", value: timer.days },
    { label: "Hours", value: timer.hours },
    { label: "Minutes", value: timer.minutes },
    { label: "Seconds", value: timer.seconds },
  ];

  return (
    <section className="pt-14">
      <Container>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <SectionHeader eyebrow="Today's" title="Flash Sales" />

          <div className="flex items-center gap-2">
            {countdown.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-white px-3 py-2 text-center"
              >
                <p className="font-mono text-base font-bold text-foreground">{item.value}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {loadingProducts ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`home-flash-loading-${idx}`}
                className="h-72 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : null}

        {!loadingProducts && flashProducts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
            No products available yet.
          </div>
        ) : null}

        {!loadingProducts && flashProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {flashProducts.map((item) => {
              const originalPrice = Math.round(item.price * 1.2);
              const discount = Math.round(((originalPrice - item.price) / originalPrice) * 100);

              return (
                <ProductCard
                  key={item._id}
                  title={item.name}
                  price={item.price}
                  originalPrice={originalPrice}
                  rating={item.ratings || 0}
                  reviews={Math.max(8, Math.round((item.ratings || 0) * 25))}
                  imageLabel={item.category}
                  imageUrl={item.productImages?.[0]}
                  href={`/products/${item._id}`}
                  badge={`-${discount}%`}
                  isWishlisted={wishlistIds.includes(item._id)}
                  onToggleWishlist={() => handleToggleWishlist(item._id)}
                  actionBusy={busyProductId === item._id}
                />
              );
            })}
          </div>
        ) : null}

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