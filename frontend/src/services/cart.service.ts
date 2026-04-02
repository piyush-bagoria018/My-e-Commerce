import { apiRequest } from "@/config/api";
import type { Cart } from "@/types/cart";

export type { Cart };

type AddToCartInput = {
	productId: string;
	quantity: number;
};

export async function getUserCart(userId: string): Promise<Cart> {
	return apiRequest<Cart>(`/cart/${userId}`);
}

export async function addToCart(input: AddToCartInput): Promise<Cart> {
	return apiRequest<Cart>("/cart/add", {
		method: "POST",
		body: input,
	});
}

export async function updateCartItem(
	productId: string,
	quantity: number
): Promise<Cart> {
	return apiRequest<Cart>(`/cart/update/${productId}`, {
		method: "PUT",
		body: { productId, quantity },
	});
}

export async function removeFromCart(productId: string): Promise<Cart> {
	return apiRequest<Cart>(`/cart/remove/${productId}`, {
		method: "DELETE",
		body: { productId },
	});
}