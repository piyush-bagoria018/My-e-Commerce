import type { Product } from "./product";

export type CartItem = {
	productId: string | Product;
	quantity: number;
};

export type Cart = {
	_id: string;
	userId: string;
	products: CartItem[];
	totalPrice: number;
	createdAt?: string;
	updatedAt?: string;
};