"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/common/TopBar";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { getOrderById } from "@/services/order.service";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  type RazorpayOrder,
} from "@/services/payment.service";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

function asProduct(value: unknown): Product | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record._id !== "string") return null;
  return record as unknown as Product;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [message, setMessage] = useState("");

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoadingOrder(true);
      setMessage("");
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to load order";
      setMessage(text);
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadOrder();
    }
  }, [isLoading, isAuthenticated, loadOrder]);

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

  const openRazorpayCheckout = (
    razorpayOrder: RazorpayOrder
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
        description: "Retry Order Payment",
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.fullname || "",
          email: user?.email || "",
          contact: user?.phone || "",
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

      rzp.on("payment.failed", () => resolve(null));
      rzp.open();
    });
  };

  const handleRetryPayment = async () => {
    if (!order) return;

    try {
      setProcessingPayment(true);
      setMessage("");

      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        setMessage("Failed to load Razorpay SDK. Please try again.");
        return;
      }

      const razorpayOrder = await createRazorpayOrder(order._id);
      const paymentResult = await openRazorpayCheckout(razorpayOrder);

      if (!paymentResult) {
        setMessage("Payment was cancelled or failed.");
        return;
      }

      await verifyRazorpayPayment(paymentResult);
      await loadOrder();
      setMessage("Payment completed successfully.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Payment retry failed";
      setMessage(text);
    } finally {
      setProcessingPayment(false);
    }
  };

  const orderTotal = useMemo(() => {
    if (!order) return 0;
    return order.totalPrice;
  }, [order]);

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
            <Link href="/dashboard/orders" className="transition hover:text-foreground">
              Orders
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Order Detail</span>
          </div>

          {isLoading || loadingOrder ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
              Loading order details...
            </div>
          ) : null}

          {!isLoading && !loadingOrder && !order ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <h1 className="font-display text-2xl font-semibold text-foreground">Order not found</h1>
              <p className="mt-2 text-sm text-muted">This order may have been removed or is inaccessible.</p>
              <Link
                href="/dashboard/orders"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              >
                Back to Orders
              </Link>
            </div>
          ) : null}

          {!isLoading && !loadingOrder && order ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <h1 className="font-display text-2xl font-semibold text-foreground">Order Details</h1>

                <div className="mt-5 space-y-4 rounded-xl border border-border bg-white p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted">Order ID</span>
                    <span className="break-all text-right font-mono text-xs text-foreground/80">{order._id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Payment Method</span>
                    <span className="font-medium uppercase">{order.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Payment Status</span>
                    <span className="font-medium capitalize">{order.paymentStatus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Delivery Status</span>
                    <span className="font-medium">{order.deliveryStatus}</span>
                  </div>
                </div>

                <h2 className="mt-8 text-lg font-semibold text-foreground">Shipping Address</h2>
                <div className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-muted">
                  <p>{order.shippingAddress.address}</p>
                  <p className="mt-1">
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </p>
                  <p className="mt-1">{order.shippingAddress.country}</p>
                </div>

                <h2 className="mt-8 text-lg font-semibold text-foreground">Order Items</h2>
                <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
                  {order.orderItems.map((item, index) => {
                    const product = asProduct(item.product);
                    return (
                      <div
                        key={`${product?._id || "item"}-${index}`}
                        className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{product?.name || "Product"}</p>
                          <p className="text-muted">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-foreground">
                          Rs {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-xl font-semibold text-foreground">Summary</h2>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="font-semibold">Rs {orderTotal.toLocaleString()}</span>
                  </div>
                </div>

                {order.paymentMethod === "razorpay" && order.paymentStatus !== "paid" ? (
                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    disabled={processingPayment}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary/60"
                  >
                    {processingPayment ? "Processing..." : "Pay Now"}
                  </button>
                ) : null}

                <Link
                  href="/dashboard/orders"
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border border-border text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  Back to Orders
                </Link>

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