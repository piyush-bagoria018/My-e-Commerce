"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/common/TopBar";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { addToCart, getUserCart, removeFromCart } from "@/services/cart.service";
import {
  getWishlist,
  removeFromWishlist,
  type Wishlist,
} from "@/services/wishlist.service";
import { getAllProducts } from "@/services/product.service";
import type { Product } from "@/types/product";

export default function WishlistPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const loadWishlist = useCallback(async () => {
    try {
      setLoadingWishlist(true);
      setMessage("");
      const data = await getWishlist();
      setWishlist(data);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to fetch wishlist";
      if (text.toLowerCase().includes("wishlist not found")) {
        setWishlist({ _id: "", userId: "", products: [] });
      } else {
        setMessage(text);
      }
    } finally {
      setLoadingWishlist(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadWishlist();

      getAllProducts()
        .then((data) => setProducts(data))
        .catch(() => setProducts([]));

      if (user?._id) {
        getUserCart(user._id)
          .then((data) => {
            const ids = data.products
              .map((item) =>
                typeof item.productId === "string" ? item.productId : item.productId?._id
              )
              .filter((id): id is string => Boolean(id));
            setCartIds(ids);
          })
          .catch((error) => {
            const text = error instanceof Error ? error.message.toLowerCase() : "";
            if (text.includes("cart not found")) {
              setCartIds([]);
            }
          });
      }
    }
  }, [isLoading, isAuthenticated, loadWishlist, user?._id]);

  const wishlistProducts = useMemo(() => wishlist?.products || [], [wishlist]);

  const suggestions = useMemo(() => {
    const inWishlist = new Set(wishlistProducts.map((item) => item._id));
    return products.filter((product) => !inWishlist.has(product._id)).slice(0, 4);
  }, [products, wishlistProducts]);

  const handleRemove = async (productId: string) => {
    try {
      setWorking(true);
      setMessage("");
      await removeFromWishlist(productId);
      await loadWishlist();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to remove item";
      setMessage(text);
    } finally {
      setWorking(false);
    }
  };

  const handleCartToggle = async (productId: string) => {
    try {
      setWorking(true);
      setMessage("");

      const existsInCart = cartIds.includes(productId);
      if (existsInCart) {
        await removeFromCart(productId);
        setCartIds((prev) => prev.filter((id) => id !== productId));
        setMessage("Item removed from cart.");
      } else {
        await addToCart({ productId, quantity: 1 });
        setCartIds((prev) => [...prev, productId]);
        setMessage("Item added to cart.");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update cart";
      setMessage(text);
    } finally {
      setWorking(false);
    }
  };

  const handleMoveAllToCart = async () => {
    if (!wishlistProducts.length) return;

    try {
      setWorking(true);
      setMessage("");

      for (const item of wishlistProducts) {
        if (!cartIds.includes(item._id)) {
          await addToCart({ productId: item._id, quantity: 1 });
        }
        await removeFromWishlist(item._id);
      }

      if (wishlistProducts.length > 0) {
        setCartIds((prev) => [
          ...prev,
          ...wishlistProducts.map((item) => item._id).filter((id) => !prev.includes(id)),
        ]);
      }

      await loadWishlist();
      setMessage("All wishlist items moved to cart.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to move items";
      setMessage(text);
    } finally {
      setWorking(false);
    }
  };

  const renderCard = (product: Product, removable: boolean) => (
    <article key={product._id} className="rounded-xl border border-border bg-surface p-3">
      <div className="relative h-44 overflow-hidden rounded-lg bg-linear-to-br from-[#f3f6f6] to-[#dfe8e8]">
        {removable ? (
          <button
            type="button"
            onClick={() => handleRemove(product._id)}
            className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white text-xs shadow transition hover:bg-red-50"
            aria-label="Remove from wishlist"
            disabled={working}
          >
            🗑
          </button>
        ) : null}

        <Link href={`/products/${product._id}`}>
          {product.productImages?.[0] ? (
            <Image
              src={product.productImages[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">{product.category}</div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => handleCartToggle(product._id)}
          className="absolute inset-x-0 bottom-0 bg-foreground py-2 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-60"
          disabled={working}
        >
          {cartIds.includes(product._id) ? "Remove From Cart" : "Add To Cart"}
        </button>
      </div>

      <Link href={`/products/${product._id}`} className="mt-3 block text-sm font-semibold text-foreground line-clamp-1">
        {product.name}
      </Link>
      <p className="mt-1 text-sm font-semibold text-primary">Rs {product.price.toLocaleString()}</p>
    </article>
  );

  return (
    <>
      <TopBar />
      <Header />

      <main className="pb-16 pt-10">
        <Container>
          <section>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                Wishlist ({wishlistProducts.length})
              </h1>
              <button
                type="button"
                onClick={handleMoveAllToCart}
                disabled={working || wishlistProducts.length === 0}
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border px-5 text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted sm:w-auto"
              >
                Move All To Cart
              </button>
            </div>

            {isLoading || loadingWishlist ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
                Loading wishlist...
              </div>
            ) : null}

            {!isLoading && !loadingWishlist && wishlistProducts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="text-base font-medium text-foreground">Your wishlist is empty</p>
                <p className="mt-2 text-sm text-muted">Save items you love and buy them later.</p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
                >
                  Explore Products
                </Link>
              </div>
            ) : null}

            {!isLoading && !loadingWishlist && wishlistProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {wishlistProducts.map((product) => renderCard(product, true))}
              </div>
            ) : null}
          </section>

          <section className="mt-14">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">Just For You</h2>
              <Link
                href="/products"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition hover:border-primary hover:text-primary"
              >
                See All
              </Link>
            </div>

            {suggestions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {suggestions.map((product) => renderCard(product, false))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                More recommendations will appear as your catalog grows.
              </div>
            )}
          </section>

          {message ? <p className="mt-6 text-sm text-primary">{message}</p> : null}
        </Container>
      </main>

      <Footer />
    </>
  );
}