import { apiRequest } from "@/config/api";
import type { CreateOrderInput, Order } from "@/types/order";

export async function createOrder(input: CreateOrderInput): Promise<Order> {
	return apiRequest<Order>("/orders/create", {
		method: "POST",
		body: input,
	});
}

export async function getMyOrders(): Promise<Order[]> {
	return apiRequest<Order[]>("/orders/all");
}

export async function getOrderById(orderId: string): Promise<Order> {
	return apiRequest<Order>(`/orders/${orderId}`);
}