"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/common/TopBar";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMyOrders } from "@/services/order.service";
import type { Order } from "@/types/order";

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        setError("");
        const data = await getMyOrders();
        setOrders(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load orders";
        setError(message);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [isLoading, isAuthenticated]);

  return (
    <>
      <TopBar />
      <Header />

      <main className="pb-16 pt-10">
        <Container>
          <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">My Orders</h1>
            <p className="mt-2 text-sm text-muted">
              Track your orders, check statuses, and view order history.
            </p>

            {isLoading || loadingOrders ? (
              <p className="mt-6 text-sm text-muted">Loading orders...</p>
            ) : null}

            {!isLoading && !loadingOrders && !isAuthenticated ? (
              <p className="mt-6 text-sm text-muted">Redirecting to login...</p>
            ) : null}

            {!isLoading && !loadingOrders && error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {!isLoading && !loadingOrders && !error && isAuthenticated && orders.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-border bg-white p-8 text-center">
                <p className="text-base font-medium text-foreground">No orders yet</p>
                <p className="mt-2 text-sm text-muted">
                  Start shopping and your recent orders will appear here.
                </p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
                >
                  Browse Products
                </Link>
              </div>
            ) : null}

            {!isLoading && !loadingOrders && !error && isAuthenticated && orders.length > 0 ? (
              <div className="mt-8 space-y-4">
                {orders.map((order) => (
                  <article key={order._id} className="rounded-xl border border-border bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted">Order ID</p>
                        <p className="font-mono text-xs text-foreground/80">{order._id}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-muted">Total</p>
                        <p className="font-semibold text-foreground">Rs {order.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                        Payment: {order.paymentStatus}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                        Delivery: {order.deliveryStatus}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                        Items: {order.orderItems.length}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/dashboard/orders/${order._id}`}
                        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border px-4 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary sm:w-auto"
                      >
                        View Details
                      </Link>

                      {order.paymentMethod === "razorpay" && order.paymentStatus !== "paid" ? (
                        <p className="text-xs font-medium text-primary">
                          Payment pending. Complete payment from order details.
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </Container>
      </main>

      <Footer />
    </>
  );
}