export type UnifiedAttribute = {
	name: string;
	value: string | number | null;
	uom?: string | null;
};

export class UnifiedProductDto {
	sku!: string;                 // string to avoid bigint issues
	upc?: string | null;

	brand?: string | null;
	model?: string | null;

	title?: string | null;
	longDescription?: string | null;
	shortDescription?: string | null;

	category?: string | null;
	subcategory?: string | null;

	price?: number | null;
	unit?: string | null;
	weight?: number | null;
	taxable?: boolean | null;

	availability?: string | null;

	ecommerceFlags?: {
		isEcomm?: boolean | null;
		discountable?: boolean | null;
	};

	images?: string[];
	documents?: { name: string; url?: string }[];
	attributes?: UnifiedAttribute[];

	raw?: {
		orgill?: Record<string, any>;
		counterpoint?: Record<string, any>;
	};
}