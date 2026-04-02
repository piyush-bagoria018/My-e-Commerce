export type Product = {
	_id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	stock: number;
	productImages: string[];
	isFeatured: boolean;
	ratings: number;
	createdAt?: string;
	updatedAt?: string;
};