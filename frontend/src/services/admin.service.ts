import { API_BASE_URL, apiRequest } from "@/config/api";
import type { Product } from "@/types/product";
import type { Order } from "@/types/order";

export type AdminUser = {
  _id: string;
  fullname?: string;
  email?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
};

export type AdminOrder = Omit<Order, "user"> & {
  user:
    | string
    | {
        _id: string;
        fullname?: string;
        email?: string;
        phone?: string;
      };
};

export type AdminProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  isFeatured?: boolean;
  ratings: number;
};

type ApiEnvelope<T> = {
  statuscode: number;
  data: T;
  message: string;
  success: boolean;
};

function appendProductFields(formData: FormData, input: AdminProductInput) {
  formData.append("name", input.name);
  formData.append("description", input.description);
  formData.append("price", String(input.price));
  formData.append("category", input.category);
  formData.append("stock", String(input.stock));
  if (typeof input.isFeatured !== "undefined") {
    formData.append("isFeatured", String(input.isFeatured));
  }
  if (typeof input.ratings !== "undefined") {
    formData.append("ratings", String(input.ratings));
  }
}

async function sendProductForm(
  path: string,
  method: "POST" | "PUT",
  input: AdminProductInput,
  images: File[]
): Promise<Product> {
  const formData = new FormData();
  appendProductFields(formData, input);

  for (const image of images) {
    formData.append("productImages", image);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    body: formData,
  });

  const payload = (await response.json()) as ApiEnvelope<Product>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Admin product request failed");
  }

  return payload.data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/admin/users");
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  return apiRequest<AdminOrder[]>("/admin/orders");
}

export async function getAdminProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/admin/products");
}

export async function createAdminProduct(
  input: AdminProductInput,
  images: File[]
): Promise<Product> {
  return sendProductForm("/admin/createProduct", "POST", input, images);
}

export async function updateAdminProduct(
  productId: string,
  input: AdminProductInput,
  images: File[] = []
): Promise<Product> {
  return sendProductForm(`/admin/updateProduct/${productId}`, "PUT", input, images);
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await apiRequest<unknown>(`/admin/deleteProduct/${productId}`, {
    method: "DELETE",
  });
}
