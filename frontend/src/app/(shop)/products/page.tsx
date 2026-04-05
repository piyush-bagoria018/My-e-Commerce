"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Footer } from "@/components/common/Footer";
import { Header } from "@/components/common/Header";
import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProductCard } from "@/components/product/ProductCard";
import { addToCart, getUserCart, removeFromCart } from "@/services/cart.service";
import { getAllProducts } from "@/services/product.service";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "@/services/wishlist.service";
import type { Product } from "@/types/product";

type SortBy = "newest" | "price-low" | "price-high" | "rating";

const CATEGORY_ORDER = [
  "Men's Lifestyle",
  "Women's Lifestyle",
  "Phones",
  "Laptops",
  "SmartWatch",
  "HeadPhones",
  "Gaming",
  "Electronics",
  "Sports",
  "Home & Lifestyle",
  "Baby & Toys",
  "Health & Beauty",
] as const;

const CATEGORY_ALIASES: Record<string, string> = {
  "men's clothes": "Men's Lifestyle",
  "men's fashion": "Men's Lifestyle",
  "men's lifestyle": "Men's Lifestyle",
  "women's clothes": "Women's Lifestyle",
  "women's fashion": "Women's Lifestyle",
  "women's lifestyle": "Women's Lifestyle",
  smartphones: "Phones",
  electronics: "Electronics",
  "headphones": "HeadPhones",
  "sports & outdoors": "Sports",
};

function normalizeCategory(input?: string) {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  return CATEGORY_ALIASES[lower] || trimmed;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load products";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setWishlistIds([]);
      setCartIds([]);
      return;
    }

    const loadWishlist = async () => {
      try {
        const data = await getWishlist();
        setWishlistIds(data.products.map((item) => item._id));
      } catch (err) {
        const text = err instanceof Error ? err.message.toLowerCase() : "";
        if (text.includes("wishlist not found")) {
          setWishlistIds([]);
          return;
        }
      }
    };

    loadWishlist();

    const loadCart = async () => {
      if (!user?._id) return;

      try {
        const data = await getUserCart(user._id);
        const ids = data.products
          .map((item) =>
            typeof item.productId === "string" ? item.productId : item.productId?._id
          )
          .filter((id): id is string => Boolean(id));
        setCartIds(ids);
      } catch (err) {
        const text = err instanceof Error ? err.message.toLowerCase() : "";
        if (text.includes("cart not found")) {
          setCartIds([]);
        }
      }
    };

    loadCart();
  }, [authLoading, isAuthenticated, user?._id]);

  const categories = useMemo(() => {
    const normalized = Array.from(
      new Set(
        products
          .map((product) => normalizeCategory(product.category))
          .filter(Boolean)
      )
    );

    const ordered = CATEGORY_ORDER.filter((item) => normalized.includes(item));
    const extra = normalized.filter((item) => !CATEGORY_ORDER.includes(item as (typeof CATEGORY_ORDER)[number]));

    return ["all", ...ordered, ...extra];
  }, [products]);

  useEffect(() => {
    const searchQuery = searchParams.get("search") || "";
    const categoryQuery = searchParams.get("category") || "all";

    setSearch(searchQuery);

    if (categoryQuery.toLowerCase() === "all") {
      setCategory("all");
      return;
    }

    const matchedCategory = categories.find(
      (item) => item.toLowerCase() === categoryQuery.toLowerCase()
    );
    setCategory(matchedCategory || "all");
  }, [searchParams, categories]);

  const filteredProducts = useMemo(() => {
    const searched = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchesCategory =
        category === "all" || normalizeCategory(product.category).toLowerCase() === category.toLowerCase();
      return matchesSearch && matchesCategory;
    });

    const sorted = [...searched];
    sorted.sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return (b.ratings || 0) - (a.ratings || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return sorted;
  }, [products, search, category, sortBy]);

  const handleCartToggle = async (productId: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      setBusyProductId(productId);
      setActionMessage("");

      const existsInCart = cartIds.includes(productId);
      if (existsInCart) {
        await removeFromCart(productId);
        setCartIds((prev) => prev.filter((id) => id !== productId));
        setActionMessage("Item removed from cart.");
      } else {
        await addToCart({ productId, quantity: 1 });
        setCartIds((prev) => [...prev, productId]);
        setActionMessage("Item added to cart.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update cart";
      setActionMessage(message);
    } finally {
      setBusyProductId(null);
    }
  };

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
    } catch (err) {
      console.error(
        "[WISHLIST] Failed to update wishlist:",
        err instanceof Error ? err.message : err
      );
    } finally {
      setBusyProductId(null);
    }
  };

  return (
    <>
      <TopBar />
      <Header />

      <main className="pb-16 pt-10">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                <span className="inline-block h-5 w-1.5 rounded-full bg-accent" />
                Store Catalog
              </p>
              <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Explore Products
              </h1>
              <p className="mt-2 text-sm text-muted">
                Browse products with simple filters. Clean, fast, and familiar.
              </p>
            </div>

            <div className="text-sm text-muted">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
            </div>
          </div>

          <div className="mb-8 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name"
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Categories" : item}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setSortBy("newest");
              }}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm font-medium transition hover:border-primary hover:text-primary sm:col-span-2 lg:col-span-1"
            >
              Reset Filters
            </button>
          </div>

          {actionMessage ? (
            <div className="mb-5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {actionMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={`loading-card-${idx}`}
                  className="h-72 animate-pulse rounded-2xl border border-border bg-surface"
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
              No products matched your filters.
            </div>
          ) : null}

          {!loading && !error && filteredProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  title={product.name}
                  price={product.price}
                  originalPrice={Math.round(product.price * 1.15)}
                  rating={product.ratings || 0}
                  reviews={Math.max(8, Math.round((product.ratings || 0) * 28))}
                  imageLabel={product.category}
                  imageUrl={product.productImages?.[0]}
                  href={`/products/${product._id}`}
                  badge={product.stock < 10 ? "Low Stock" : undefined}
                  isWishlisted={wishlistIds.includes(product._id)}
                  onToggleWishlist={() => handleToggleWishlist(product._id)}
                  onAddToCart={() => handleCartToggle(product._id)}
                  cartActionLabel={
                    cartIds.includes(product._id) ? "Remove from Cart" : "Add to Cart"
                  }
                  actionBusy={busyProductId === product._id}
                />
              ))}
            </div>
          ) : null}
        </Container>
      </main>

      <Footer />
    </>
  );
}