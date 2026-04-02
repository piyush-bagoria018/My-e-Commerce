"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/common/TopBar";
import { Header } from "@/components/common/Header";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Product } from "@/types/product";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  updateAdminProduct,
  type AdminOrder,
  type AdminProductInput,
  type AdminUser,
} from "@/services/admin.service";

type TabKey = "products" | "orders" | "users";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  ratings: string;
  isFeatured: boolean;
};

const initialForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "",
  ratings: "0",
  isFeatured: false,
};

function toInput(form: ProductFormState): AdminProductInput {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    category: form.category.trim(),
    stock: Number(form.stock),
    ratings: Number(form.ratings),
    isFeatured: form.isFeatured,
  };
}

function prettyDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role !== "admin") {
      router.replace("/");
      return;
    }

    const loadData = async () => {
      try {
        setPageLoading(true);
        const [productData, orderData, userData] = await Promise.all([
          getAdminProducts(),
          getAdminOrders(),
          getAdminUsers(),
        ]);
        setProducts(productData);
        setOrders(orderData);
        setUsers(userData);
      } catch (error) {
        const text = error instanceof Error ? error.message : "Failed to load admin data";
        setMessage(text);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, isLoading, router, user?.role]);

  const productCategories = useMemo(() => {
    const set = new Set(products.map((item) => item.category).filter(Boolean));
    return Array.from(set);
  }, [products]);

  const resetForm = () => {
    setForm(initialForm);
    setFiles([]);
    setEditingId(null);
  };

  const validateForm = () => {
    const input = toInput(form);
    if (!input.name || !input.description || !input.category) {
      return "Name, description, and category are required.";
    }
    if (Number.isNaN(input.price) || input.price < 0) {
      return "Price must be a valid number.";
    }
    if (Number.isNaN(input.stock) || input.stock < 0) {
      return "Stock must be a valid number.";
    }
    if (Number.isNaN(input.ratings) || input.ratings < 0 || input.ratings > 5) {
      return "Ratings must be between 0 and 5.";
    }
    return "";
  };

  const handleSubmitProduct = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const input = toInput(form);
      let saved: Product;

      if (editingId) {
        saved = await updateAdminProduct(editingId, input, files);
        setProducts((prev) => prev.map((item) => (item._id === saved._id ? saved : item)));
        setMessage("Product updated successfully.");
      } else {
        saved = await createAdminProduct(input, files);
        setProducts((prev) => [saved, ...prev]);
        setMessage("Product created successfully.");
      }

      resetForm();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to save product";
      setMessage(text);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setMessage("");
      await deleteAdminProduct(productId);
      setProducts((prev) => prev.filter((item) => item._id !== productId));
      if (editingId === productId) {
        resetForm();
      }
      setMessage("Product deleted successfully.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to delete product";
      setMessage(text);
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      stock: String(product.stock ?? ""),
      ratings: String(product.ratings ?? 0),
      isFeatured: Boolean(product.isFeatured),
    });
    setFiles([]);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <TopBar />
      <Header />

      <main className="pb-10 pt-8">
        <Container>
          <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h1 className="font-display text-3xl font-semibold text-foreground">Admin Panel</h1>
            <p className="mt-2 text-sm text-muted">
              Simple management for products, orders, and users.
            </p>

            {pageLoading ? <p className="mt-6 text-sm text-muted">Loading admin data...</p> : null}
            {!pageLoading && user?.role !== "admin" ? (
              <p className="mt-6 text-sm text-muted">Redirecting...</p>
            ) : null}

            {!pageLoading && user?.role === "admin" ? (
              <>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("products")}
                    className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                      activeTab === "products"
                        ? "bg-primary text-white"
                        : "border border-border bg-white text-foreground hover:border-primary"
                    }`}
                  >
                    Products ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                      activeTab === "orders"
                        ? "bg-primary text-white"
                        : "border border-border bg-white text-foreground hover:border-primary"
                    }`}
                  >
                    Orders ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                      activeTab === "users"
                        ? "bg-primary text-white"
                        : "border border-border bg-white text-foreground hover:border-primary"
                    }`}
                  >
                    Users ({users.length})
                  </button>
                </div>

                {message ? (
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {message}
                  </div>
                ) : null}

                {activeTab === "products" ? (
                  <div className="mt-6 space-y-6">
                    <div className="rounded-xl border border-border bg-white p-5">
                      <h2 className="text-lg font-semibold text-foreground">
                        {editingId ? "Update Product" : "Add New Product"}
                      </h2>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label>
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                            Name
                          </span>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                            disabled={actionLoading}
                          />
                        </label>

                        <label>
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                            Category
                          </span>
                          <input
                            type="text"
                            list="admin-categories"
                            value={form.category}
                            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                            className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                            disabled={actionLoading}
                          />
                          <datalist id="admin-categories">
                            {productCategories.map((item) => (
                              <option key={item} value={item} />
                            ))}
                          </datalist>
                        </label>

                        <label>
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                            Price
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                            className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                            disabled={actionLoading}
                          />
                        </label>

                        <label>
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                            Stock
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={form.stock}
                            onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                            className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                            disabled={actionLoading}
                          />
                        </label>

                        <label>
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                            Ratings (0-5)
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={form.ratings}
                            onChange={(event) => setForm((prev) => ({ ...prev, ratings: event.target.value }))}
                            className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                            disabled={actionLoading}
                          />
                        </label>

                        <label className="flex items-center gap-2 pt-7">
                          <input
                            type="checkbox"
                            checked={form.isFeatured}
                            onChange={(event) =>
                              setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))
                            }
                            disabled={actionLoading}
                          />
                          <span className="text-sm text-foreground">Featured Product</span>
                        </label>

                        <label className="sm:col-span-2">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                            Description
                          </span>
                          <textarea
                            rows={4}
                            value={form.description}
                            onChange={(event) =>
                              setForm((prev) => ({ ...prev, description: event.target.value }))
                            }
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                            disabled={actionLoading}
                          />
                        </label>

                        <label className="sm:col-span-2">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                            Product Images (up to 5)
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(event) =>
                              setFiles(Array.from(event.target.files || []).slice(0, 5))
                            }
                            className="block w-full text-sm text-foreground"
                            disabled={actionLoading}
                          />
                          {files.length > 0 ? (
                            <p className="mt-2 text-xs text-muted">{files.length} file(s) selected</p>
                          ) : null}
                        </label>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSubmitProduct}
                          disabled={actionLoading}
                          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary/60"
                        >
                          {actionLoading
                            ? "Saving..."
                            : editingId
                            ? "Update Product"
                            : "Create Product"}
                        </button>

                        {editingId ? (
                          <button
                            type="button"
                            onClick={resetForm}
                            disabled={actionLoading}
                            className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed"
                          >
                            Cancel Edit
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 md:hidden">
                      {products.map((item) => (
                        <article key={`mobile-${item._id}`} className="rounded-xl border border-border bg-white p-4">
                          <div className="flex items-start gap-3">
                            {item.productImages?.[0] ? (
                              <div className="relative h-12 w-12 overflow-hidden rounded">
                                <Image
                                  src={item.productImages[0]}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded bg-slate-200" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}</p>
                              <p className="mt-1 text-xs text-muted">Category: {item.category}</p>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-foreground/80">
                            <p>Price: Rs {item.price}</p>
                            <p>Stock: {item.stock}</p>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(item._id)}
                              className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Product</th>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Price</th>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Stock</th>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((item) => (
                            <tr key={item._id} className="border-t border-border">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {item.productImages?.[0] ? (
                                    <div className="relative h-10 w-10 overflow-hidden rounded">
                                      <Image
                                        src={item.productImages[0]}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-slate-200" />
                                  )}
                                    <span className="line-clamp-2 font-medium text-foreground">{item.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-foreground/80">{item.category}</td>
                              <td className="px-4 py-3 text-foreground/80">Rs {item.price}</td>
                              <td className="px-4 py-3 text-foreground/80">{item.stock}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item)}
                                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(item._id)}
                                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {activeTab === "orders" ? (
                  <>
                    <div className="mt-6 space-y-3 md:hidden">
                      {orders.map((item) => {
                        const orderUser = item.user as AdminOrder["user"];
                        const customer =
                          typeof orderUser === "string"
                            ? orderUser
                            :
                                orderUser.fullname ||
                                orderUser.email ||
                                orderUser.phone ||
                                orderUser._id;

                        return (
                          <article key={`mobile-order-${item._id}`} className="rounded-xl border border-border bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs text-muted">Order</p>
                                <p className="font-mono text-xs text-foreground/80">{item._id.slice(-8)}</p>
                              </div>
                              <p className="text-sm font-semibold text-foreground">Rs {item.totalPrice}</p>
                            </div>
                            <p className="mt-2 text-sm text-foreground/80">{customer}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 capitalize">
                                Payment: {item.paymentStatus}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                Delivery: {item.deliveryStatus}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                {prettyDate(item.createdAt)}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="mt-6 hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
                      <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Order ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Amount</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Payment</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Delivery</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((item) => {
                          const orderUser = item.user as AdminOrder["user"];
                          const customer =
                            typeof orderUser === "string"
                              ? orderUser
                              :
                                  orderUser.fullname ||
                                  orderUser.email ||
                                  orderUser.phone ||
                                  orderUser._id;

                          return (
                            <tr key={item._id} className="border-t border-border">
                              <td className="px-4 py-3 text-foreground/80">{item._id.slice(-8)}</td>
                              <td className="px-4 py-3 text-foreground/80">{customer}</td>
                              <td className="px-4 py-3 text-foreground/80">Rs {item.totalPrice}</td>
                              <td className="px-4 py-3 text-foreground/80 capitalize">{item.paymentStatus}</td>
                              <td className="px-4 py-3 text-foreground/80">{item.deliveryStatus}</td>
                              <td className="px-4 py-3 text-foreground/80">{prettyDate(item.createdAt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  </>
                ) : null}

                {activeTab === "users" ? (
                  <>
                    <div className="mt-6 space-y-3 md:hidden">
                      {users.map((item) => (
                        <article key={`mobile-user-${item._id}`} className="rounded-xl border border-border bg-white p-4">
                          <p className="text-sm font-semibold text-foreground">{item.fullname || "-"}</p>
                          <p className="mt-1 text-xs text-foreground/80">{item.email || "-"}</p>
                          <p className="mt-1 text-xs text-foreground/80">{item.phone || "-"}</p>
                          <p className="mt-2 text-xs text-muted">Joined: {prettyDate(item.createdAt)}</p>
                        </article>
                      ))}
                    </div>

                    <div className="mt-6 hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
                      <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Email</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Phone</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((item) => (
                          <tr key={item._id} className="border-t border-border">
                            <td className="px-4 py-3 text-foreground/80">{item.fullname || "-"}</td>
                            <td className="px-4 py-3 text-foreground/80">{item.email || "-"}</td>
                            <td className="px-4 py-3 text-foreground/80">{item.phone || "-"}</td>
                            <td className="px-4 py-3 text-foreground/80">{prettyDate(item.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </section>
        </Container>
      </main>
    </>
  );
}
