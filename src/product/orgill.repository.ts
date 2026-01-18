import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class OrgillRepository {
	constructor(private readonly ds: DataSource) {}

	async findBySku(sku: string) {
		const rows = await this.ds.query(
			`
			SELECT
				sku::text AS sku,
				"upc-code"::text AS upc_code,
				"brand-name" AS brand_name,
				"model-number" AS model_number,
				"category-code"::text AS category_code,
				"category-title-description" AS category_title_description,
				"online-title-description" AS online_title_description,
				"online-long-description" AS online_long_description,

				"item-image-item-image1" AS image1,
				"item-image-item-image2" AS image2,
				"item-image-item-image3" AS image3,
				"item-image-item-image4" AS image4,

				"item-document-name-1" AS doc1,
				"item-document-name-2" AS doc2,
				"item-document-name-3" AS doc3,

				*
			FROM public.orgill_products
			WHERE sku = $1
			LIMIT 1
			`,
			[sku],
		);
		return rows?.[0] ?? null;
	}

	async getCountByCategory(categoryTitle: string): Promise<number> {
		/**
		 * Map frontend category titles to category codes from Counterpoint/Orgill
		 * The mapping is based on the category-title-description field
		 */
		const categoryMap: { [key: string]: string } = {
			'Building': '%Building%',
			'Materials': '%Materials%',
			'Tools': '%Tools%',
			'Hardware': '%Hardware%',
			'Plumbing': '%Plumbing%',
			'Electrical': '%Electrical%',
			'Flooring': '%Flooring%',
			'Roofing': '%Roofing%',
			'Gutters': '%Gutters%',
			'Paint': '%Paint%',
			'Decor': '%Decor%',
			'Safety': '%Safety%',
			'Workwear': '%Workwear%',
			'Landscaping': '%Landscaping%',
			'Outdoor': '%Outdoor%',
			'HVAC': '%HVAC%',
		};

		const pattern = categoryMap[categoryTitle];
		if (!pattern) {
			return 0;
		}

		const result = await this.ds.query(
			`
			SELECT COUNT(*) as count
			FROM public.orgill_products
			WHERE "category-title-description" ILIKE $1
			`,
			[pattern],
		);

		return parseInt(result?.[0]?.count ?? '0', 10);
	}

	async getCategoryCountsForSpecific(categories: string[]): Promise<Record<string, number>> {
		/**
		 * Fetch counts for multiple specific categories from Counterpoint
		 */
		const result: Record<string, number> = {};

		for (const category of categories) {
			result[category] = await this.getCountByCategory(category);
		}

		return result;
	}
}