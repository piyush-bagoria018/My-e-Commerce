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
import {
  getUserCart,
  removeFromCart,
  updateCartItem,
  type Cart,
} from "@/services/cart.service";
import type { Product } from "@/types/product";

function asProduct(value: unknown): Product | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record._id !== "string") return null;
  return record as unknown as Product;
}

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingCart, setLoadingCart] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const loadCart = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoadingCart(true);
      setMessage("");
      const data = await getUserCart(user._id);
      setCart(data);

      const nextQuantities: Record<string, number> = {};
      data.products.forEach((item) => {
        const product = asProduct(item.productId);
        if (product?._id) {
          nextQuantities[product._id] = item.quantity;
        }
      });
      setQuantities(nextQuantities);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to load cart";
      if (text.toLowerCase().includes("cart not found")) {
        setCart({
          _id: "",
          userId: user._id,
          products: [],
          totalPrice: 0,
        });
        setQuantities({});
      } else {
        setMessage(text);
      }
    } finally {
      setLoadingCart(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadCart();
    }
  }, [isLoading, isAuthenticated, loadCart]);

  const cartRows = useMemo(() => {
    if (!cart) return [];

    return cart.products
      .map((item) => {
        const product = asProduct(item.productId);
        if (!product) return null;
        const qty = quantities[product._id] ?? item.quantity;
        return {
          product,
          quantity: qty,
          subtotal: product.price * qty,
        };
      })
      .filter((row): row is { product: Product; quantity: number; subtotal: number } => Boolean(row));
  }, [cart, quantities]);

  const subtotal = useMemo(
    () => cartRows.reduce((sum, item) => sum + item.subtotal, 0),
    [cartRows]
  );

  const handleQuantityChange = (productId: string, next: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, Math.min(10, next)),
    }));
  };

  const handleUpdateCart = async () => {
    if (!cartRows.length) return;

    try {
      setUpdating(true);
      setMessage("");

      for (const row of cartRows) {
        await updateCartItem(row.product._id, row.quantity);
      }

      await loadCart();
      setMessage("Cart updated successfully.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update cart";
      setMessage(text);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      setUpdating(true);
      setMessage("");
      await removeFromCart(productId);
      await loadCart();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to remove item";
      setMessage(text);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <TopBar />
      <Header />

      <main className="pb-16 pt-10">
        <Container>
          <div className="mb-8 flex items-center gap-2 text-xs text-muted sm:text-sm">
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Cart</span>
          </div>

          {isLoading || loadingCart ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
              Loading your cart...
            </div>
          ) : null}

          {!isLoading && !loadingCart && cartRows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <h1 className="font-display text-2xl font-semibold text-foreground">Your cart is empty</h1>
              <p className="mt-2 text-sm text-muted">Add products to continue with checkout.</p>
              <Link
                href="/products"
                className="mt-5 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              >
                Return to Shop
              </Link>
            </div>
          ) : null}

          {!isLoading && !loadingCart && cartRows.length > 0 ? (
            <section className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="hidden grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr] border-b border-border bg-white px-6 py-4 text-sm font-semibold text-foreground/90 md:grid">
                  <p>Product</p>
                  <p>Price</p>
                  <p>Quantity</p>
                  <p className="text-right">Subtotal</p>
                </div>

                <div className="divide-y divide-border">
                  {cartRows.map((row) => (
                    <div
                      key={row.product._id}
                      className="grid gap-4 px-4 py-5 md:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr] md:items-center md:px-6"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleRemove(row.product._id)}
                          className="grid h-7 w-7 place-items-center rounded-full border border-red-300 text-red-500 transition hover:bg-red-50"
                          disabled={updating}
                          aria-label="Remove item"
                        >
                          ×
                        </button>

                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-white">
                          {row.product.productImages?.[0] ? (
                            <Image
                              src={row.product.productImages[0]}
                              alt={row.product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-[10px] text-muted">No image</div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-foreground">{row.product.name}</p>
                          <p className="text-xs text-muted">{row.product.category}</p>
                        </div>
                      </div>

                      <p className="text-sm font-medium text-foreground">
                        <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-muted md:hidden">
                          Price:
                        </span>
                        Rs {row.product.price.toLocaleString()}
                      </p>

                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted md:hidden">
                          Quantity
                        </p>
                        <select
                          value={row.quantity}
                          onChange={(event) =>
                            handleQuantityChange(row.product._id, Number(event.target.value))
                          }
                          className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                          disabled={updating}
                        >
                          {Array.from({ length: 10 }).map((_, idx) => {
                            const value = idx + 1;
                            return (
                              <option key={`${row.product._id}-${value}`} value={value}>
                                {String(value).padStart(2, "0")}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <p className="text-sm font-semibold text-foreground md:text-right">
                        <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-muted md:hidden">
                          Subtotal:
                        </span>
                        Rs {row.subtotal.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/products"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium transition hover:border-primary hover:text-primary"
                >
                  Return to Shop
                </Link>

                <button
                  type="button"
                  onClick={handleUpdateCart}
                  disabled={updating}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted"
                >
                  {updating ? "Updating..." : "Update Cart"}
                </button>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary sm:max-w-sm"
                    disabled
                  />
                  <button
                    type="button"
                    className="h-11 w-full rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-65 sm:w-auto"
                    disabled
                  >
                    Apply Coupon
                  </button>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h2 className="text-xl font-semibold text-foreground">Cart Total</h2>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span>Subtotal:</span>
                      <span className="font-semibold">Rs {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span>Shipping:</span>
                      <span className="font-semibold">Free</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total:</span>
                      <span className="font-semibold">Rs {subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-strong"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>

              {message ? <p className="text-sm text-primary">{message}</p> : null}
            </section>
          ) : null}
        </Container>
      </main>

      <Footer />
    </>
  );
}