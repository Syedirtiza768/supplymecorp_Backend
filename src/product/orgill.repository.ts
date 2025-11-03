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
}