import type { Product } from "./product";

export type OrderItem = {
	product: string | Product;
	quantity: number;
	price: number;
};

export type ShippingAddress = {
	address: string;
	city: string;
	postalCode: string;
	country: string;
};

export type PaymentMethod = "cod" | "razorpay";

export type Order = {
	_id: string;
	user: string;
	orderItems: OrderItem[];
	shippingAddress: ShippingAddress;
	paymentMethod: string;
	paymentStatus: "pending" | "paid" | "failed";
	totalPrice: number;
	deliveryStatus: "Pending" | "Shipped" | "Delivered" | "Cancelled";
	createdAt?: string;
	updatedAt?: string;
};

export type CreateOrderInput = {
	orderItems: Array<{
		product: string;
		quantity: number;
	}>;
	shippingAddress: ShippingAddress;
	paymentMethod: string;
};