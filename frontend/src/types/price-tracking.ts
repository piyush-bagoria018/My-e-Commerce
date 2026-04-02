export type RecommendationConfidence = "high" | "medium" | "low";

export type PriceHistoryPoint = {
	date: string;
	price: number;
};

export type PriceHistory = {
	history: PriceHistoryPoint[];
	highest_price: number;
	lowest_price: number;
	average_price: number;
	graphData?: PriceHistoryPoint[];
};

export type PriceRecommendation = {
	verdict: string;
	reason: string;
	confidence: RecommendationConfidence;
	dropProbability: number;
	fairRange: {
		low: number;
		high: number;
	};
	currentPrice: number;
};
