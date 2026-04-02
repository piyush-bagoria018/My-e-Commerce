import { apiRequest } from "@/config/api";

export type RazorpayOrder = {
	id: string;
	amount: number;
	currency: string;
	receipt: string;
	status: string;
};

export type VerifyRazorpayInput = {
	razorpay_order_id: string;
	razorpay_payment_id: string;
	razorpay_signature: string;
};

export async function createRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
	return apiRequest<RazorpayOrder>("/payments/create-razorpay-order", {
		method: "POST",
		body: { orderId },
	});
}

export async function verifyRazorpayPayment(input: VerifyRazorpayInput): Promise<void> {
	await apiRequest<unknown>("/payments/verify-razorpay-payment", {
		method: "POST",
		body: input,
	});
}