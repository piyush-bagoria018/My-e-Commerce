import { apiRequest } from "@/config/api";
import type { PriceHistory, PriceRecommendation } from "@/types/price-tracking";

export async function getPriceRecommendation(productId: string): Promise<PriceRecommendation> {
	return apiRequest<PriceRecommendation>(`/price-tracking/${productId}/drop-chance`);
}

export async function getPriceHistory(productId: string): Promise<PriceHistory> {
	return apiRequest<PriceHistory>(`/price-tracking/${productId}/history`);
}

export async function createPriceAlert(data: {
	productId: string;
	userEmail: string;
	targetPrice: number;
}): Promise<{ _id: string; productId: string; userEmail: string; targetPrice: number }> {
	return apiRequest(
		`/price-tracking/${data.productId}/create-alert`,
		{
			method: 'POST',
			body: {
				userEmail: data.userEmail,
				targetPrice: data.targetPrice,
			},
		}
	);
}

export async function getAIAnalysis(productId: string): Promise<{
verdict: string;
dropProbability: number;
mlReason: string;
aiExplanation: string;
aiConfidence: string;
fairRange: { low: number; high: number };
currentPrice: number;
}> {
return apiRequest(
`/price-tracking/${productId}/ai-analysis`
);
}
