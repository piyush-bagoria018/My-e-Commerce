import { apiRequest } from "@/config/api";
import type { Product } from "@/types/product";

export async function getAllProducts(): Promise<Product[]> {
	return apiRequest<Product[]>("/products/all");
}

export async function getProductById(productId: string): Promise<Product> {
	return apiRequest<Product>(`/products/${productId}`);
}