"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/common/TopBar";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserCart, removeFromCart } from "@/services/cart.service";
import { createOrder } from "@/services/order.service";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  type RazorpayOrder,
} from "@/services/payment.service";
import type { Product } from "@/types/product";
import type { ShippingAddress, PaymentMethod } from "@/types/order";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

type CheckoutForm = ShippingAddress & {
  paymentMethod: PaymentMethod;
};

function asProduct(value: unknown): Product | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record._id !== "string") return null;
  return record as unknown as Product;
}

const initialForm: CheckoutForm = {
  address: "",
  city: "",
  postalCode: "",
  country: "India",
  paymentMethod: "cod",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [cartItems, setCartItems] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState("");

  const loadRazorpayScript = async () => {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) return true;

    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const clearCartAfterSuccessfulOrder = async () => {
    for (const item of cartItems) {
      await removeFromCart(item.product._id);
    }
    setCartItems([]);
  };

  const openRazorpayCheckout = (
    razorpayOrder: RazorpayOrder,
    totalAmount: number
  ): Promise<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  } | null> => {
    return new Promise((resolve) => {
      if (!window.Razorpay) {
        resolve(null);
        return;
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        resolve(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "StoreNova",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.fullname || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          amount: String(totalAmount),
        },
        theme: {
          color: "#e4572e",
        },
        handler: (response: unknown) => {
          resolve(response as {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          });
        },
        modal: {
          ondismiss: () => resolve(null),
        },
      });

      rzp.on("payment.failed", () => {
        resolve(null);
      });

      rzp.open();
    });
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user?._id || !isAuthenticated) return;

    const loadCart = async () => {
      try {
        setLoadingCart(true);
        setMessage("");
        const cart = await getUserCart(user._id);

        const rows = cart.products
          .map((item) => {
            const product = asProduct(item.productId);
            if (!product) return null;
            return { product, quantity: item.quantity };
          })
          .filter((row): row is { product: Product; quantity: number } => Boolean(row));

        setCartItems(rows);
      } catch (error) {
        const text = error instanceof Error ? error.message : "Failed to load cart";
        if (text.toLowerCase().includes("cart not found")) {
          setCartItems([]);
          return;
        }
        setMessage(text);
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, [user?._id, isAuthenticated]);

  useEffect(() => {
    const defaultAddress = user?.address?.find((item) => item.isDefault) || user?.address?.[0];
    if (!defaultAddress) return;

    setForm((prev) => {
      if (prev.address || prev.city || prev.postalCode) {
        return prev;
      }

      return {
        ...prev,
        address: defaultAddress.street || prev.address,
        city: defaultAddress.city || prev.city,
        postalCode: defaultAddress.zipCode || prev.postalCode,
        country: defaultAddress.country || prev.country,
      };
    });
  }, [user]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.address.trim()) return "Address is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.postalCode.trim()) return "Postal code is required.";
    if (!form.country.trim()) return "Country is required.";
    if (!cartItems.length) return "Cart is empty.";
    return "";
  };

  const handlePlaceOrder = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      setPlacingOrder(true);
      setMessage("");

      const order = await createOrder({
        orderItems: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          address: form.address.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
        paymentMethod: form.paymentMethod,
      });

      if (form.paymentMethod === "cod") {
        await clearCartAfterSuccessfulOrder();
        setMessage("Order placed successfully.");
        router.push(`/dashboard/orders`);
        router.refresh();
        return;
      }

      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        setMessage("Failed to load Razorpay SDK. Please try again.");
        return;
      }

      const razorpayOrder = await createRazorpayOrder(order._id);
      const paymentResult = await openRazorpayCheckout(razorpayOrder, order.totalPrice);

      if (!paymentResult) {
        setMessage("Payment was cancelled or failed. You can retry from checkout.");
        return;
      }

      await verifyRazorpayPayment(paymentResult);
      await clearCartAfterSuccessfulOrder();
      setMessage("Payment successful and order placed.");
      router.push("/dashboard/orders");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to place order";
      setMessage(text);
    } finally {
      setPlacingOrder(false);
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
            <Link href="/cart" className="transition hover:text-foreground">
              Cart
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Checkout</span>
          </div>

          {isLoading || loadingCart ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
              Loading checkout...
            </div>
          ) : null}

          {!isLoading && !loadingCart && cartItems.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <h1 className="font-display text-2xl font-semibold text-foreground">Nothing to checkout</h1>
              <p className="mt-2 text-sm text-muted">Your cart is empty. Add items before placing an order.</p>
              <Link
                href="/products"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              >
                Continue Shopping
              </Link>
            </div>
          ) : null}

          {!isLoading && !loadingCart && cartItems.length > 0 ? (
            <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <h1 className="font-display text-2xl font-semibold text-foreground">Shipping Details</h1>
                <p className="mt-1 text-sm text-muted">Enter your delivery details to place this order.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-foreground">Address</span>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(event) => handleInputChange("address", event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Street address"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-sm font-medium text-foreground">City</span>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) => handleInputChange("city", event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="City"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-sm font-medium text-foreground">Postal Code</span>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(event) => handleInputChange("postalCode", event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Postal code"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-sm font-medium text-foreground">Country</span>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(event) => handleInputChange("country", event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Country"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-sm font-medium text-foreground">Payment Method</span>
                    <select
                      value={form.paymentMethod}
                      onChange={(event) => handleInputChange("paymentMethod", event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="cod">Cash on Delivery</option>
                      <option value="razorpay">Razorpay (Online)</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>

                <div className="mt-4 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.product._id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{item.product.name}</p>
                        <p className="text-muted">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        Rs {(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">Rs {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold">Free</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span>Total</span>
                    <span className="font-semibold">Rs {subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary/60"
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>

                {message ? <p className="mt-3 text-sm text-primary">{message}</p> : null}
              </div>
            </section>
          ) : null}
        </Container>
      </main>

      <Footer />
    </>
  );
}