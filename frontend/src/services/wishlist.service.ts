import { apiRequest } from "@/config/api";
import type { Product } from "@/types/product";

export type Wishlist = {
	_id: string;
	userId: string;
	products: Product[];
	createdAt?: string;
	updatedAt?: string;
};

export async function getWishlist(): Promise<Wishlist> {
	return apiRequest<Wishlist>("/wishlist");
}

export async function addToWishlist(productId: string): Promise<Wishlist> {
	return apiRequest<Wishlist>("/wishlist/add", {
		method: "POST",
		body: { productId },
	});
}

export async function removeFromWishlist(productId: string): Promise<Wishlist> {
	return apiRequest<Wishlist>("/wishlist/remove", {
		method: "DELETE",
		body: { productId },
	});
}