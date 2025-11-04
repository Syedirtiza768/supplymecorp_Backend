import { Injectable } from '@nestjs/common';
import { UnifiedProductDto } from './dto/unified-product.dto';
import { OrgillRepository } from './orgill.repository';
import { CounterPointClient } from './counterpoint.client';
import { extractOrgillAttributes } from './utils/orgill-attributes';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto, PaginatedResponseDto, SortOrder } from './dto/pagination.dto';

@Injectable()
export class ProductService {
	constructor(
		public readonly orgillRepo: OrgillRepository,
		private readonly cp: CounterPointClient,
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		private readonly dataSource: DataSource,
	) {}

	async getUnifiedProduct(sku: string): Promise<UnifiedProductDto | null> {

		const [orgill, cp] = await Promise.all([
			this.orgillRepo.findBySku(sku),
			this.cp.getItemBySku(sku),
		]);

		// Debug log for CounterPoint response
		console.log('DEBUG CounterPoint raw response for SKU', sku, JSON.stringify(cp, null, 2));

		if (!orgill && !cp) return null;

		const images = [
			orgill?.image1,
			orgill?.image2,
			orgill?.image3,
			orgill?.image4,
		].filter(Boolean);

		const documents = [orgill?.doc1, orgill?.doc2, orgill?.doc3]
			.filter(Boolean)
			.map((name) => ({ name, url: undefined }));

		const attributes = orgill ? extractOrgillAttributes(orgill) : [];

		// Fallback logic for price
		let price: number | null = null;
		if (typeof orgill?.price === 'number') {
			price = orgill.price;
		} else if (typeof cp?.PRC_1 === 'number') {
			price = cp.PRC_1;
		} else if (typeof cp?.PREF_UNIT_PRC_1 === 'number') {
			price = cp.PREF_UNIT_PRC_1;
		}
		if (price === null) {
			console.warn(`WARNING: No price found for SKU ${sku} in either Orgill or CounterPoint.`);
		}
		return {
			sku: (orgill?.sku ?? cp?.ITEM_NO ?? sku)?.toString(),
			upc: orgill?.upc_code ?? cp?.BARCOD ?? null,

			brand: orgill?.brand_name ?? cp?.PROF_ALPHA_3 ?? null,
			model: orgill?.model_number ?? cp?.PROF_ALPHA_4 ?? null,

			title:
				orgill?.online_title_description ??
				orgill?.category_title_description ??
				cp?.DESCR ??
				null,

			longDescription: orgill?.online_long_description ?? null,
			shortDescription:
				orgill?.online_title_description ??
				orgill?.category_title_description ??
				cp?.DESCR ??
				null,

			category: orgill?.category_title_description ?? cp?.CATEG_COD ?? null,
			subcategory: orgill?.subcategory ?? cp?.SUBCAT_COD ?? null,

			price,
			availability: cp ? (cp?.STAT === 'A' ? 'In Stock' : 'Out of Stock') : null,
			unit: orgill?.unit ?? cp?.STK_UNIT ?? cp?.PREF_UNIT_NAM ?? null,
			weight: orgill?.weight ?? (typeof cp?.WEIGHT === 'number' ? cp.WEIGHT : null),
			taxable: orgill?.taxable ?? (cp?.IS_TXBL === 'Y' ? true : cp?.IS_TXBL === 'N' ? false : null),

			ecommerceFlags: {
				isEcomm: cp?.IS_ECOMM_ITEM === 'Y',
				discountable: (cp?.IS_DISCNTBL === 'Y') && (cp?.ECOMM_ITEM_IS_DISCNTBL === 'Y'),
			},

			images,
			documents,
			attributes,
			// CounterPoint fields are available under raw.counterpoint
			raw: {
				orgill: orgill ?? undefined,
				counterpoint: cp ?? undefined,
			},
		};
	}

	// --- PATCH: Fix TypeScript errors for pagination, computed property names, and type mismatches ---
	// --- PATCH: Fix sortOrder type to always be SortOrder enum ---
	// Helper to ensure pagination values are always defined
	private getPaginationDefaults(pagination: PaginationDto) {
		// Accept both string and enum, but always return as SortOrder
		let sortOrder: SortOrder = SortOrder.DESC;
		if (pagination.sortOrder === SortOrder.ASC || pagination.sortOrder === SortOrder.DESC) {
			sortOrder = pagination.sortOrder;
		} else if (pagination.sortOrder && typeof pagination.sortOrder === 'string' && typeof (pagination.sortOrder as string).toUpperCase === 'function') {
			sortOrder = (pagination.sortOrder as string).toUpperCase() === 'ASC' ? SortOrder.ASC : SortOrder.DESC;
		}
		return {
			page: pagination.page ?? 1,
			limit: pagination.limit ?? 10,
			sortBy: pagination.sortBy ?? 'id',
			sortOrder,
			search: pagination.search ?? '',
		};
	}

	// --- RESTORED STANDARD METHODS FOR CONTROLLER ---
	// Get all unique categories
	async getAllCategories(): Promise<string[]> {
		const categories = await this.productRepository
			.createQueryBuilder('product')
			.select('DISTINCT product.categoryTitleDescription', 'category')
			.where('product.categoryTitleDescription IS NOT NULL')
			.getRawMany();
		return categories.map((row: any) => row.category).filter(Boolean);
	}

	// Get all unique brands
	async getAllBrands(): Promise<string[]> {
		const brands = await this.productRepository
			.createQueryBuilder('product')
			.select('DISTINCT product.brandName', 'brand')
			.where('product.brandName IS NOT NULL')
			.getRawMany();
		return brands.map((row: any) => row.brand).filter(Boolean);
	}

			// Get products by category with pagination
			async getProductsByCategory(category: string, pagination: PaginationDto): Promise<PaginatedResponseDto<Product>> {
				const { page, limit, sortBy, sortOrder } = this.getPaginationDefaults(pagination);
				const offset = (page - 1) * limit;
				const validSortColumns = ['sku', 'category-title-description', 'brand-name', 'model-number'];
				let sortColumn = sortBy;
				if (sortBy === 'id' || !validSortColumns.includes(sortBy)) {
					sortColumn = 'sku';
				}

				// 1. Try exact category match
				let query = `
					SELECT * FROM public.orgill_products
					WHERE "category-title-description" = $1
					ORDER BY "${sortColumn}" ${sortOrder}
					OFFSET $2 LIMIT $3
				`;
				let countQuery = `
					SELECT COUNT(*) as count FROM public.orgill_products
					WHERE "category-title-description" = $1
				`;
				let rawItems = await this.dataSource.query(query, [category, offset, limit]);
				let countResult = await this.dataSource.query(countQuery, [category]);
				let total = countResult[0] ? parseInt(countResult[0].count) : 0;

				// 2. If no results, try partial match
				if (rawItems.length === 0) {
					query = `
						SELECT * FROM public.orgill_products
						WHERE "category-title-description" ILIKE $1
						ORDER BY "${sortColumn}" ${sortOrder}
						OFFSET $2 LIMIT $3
					`;
					countQuery = `
						SELECT COUNT(*) as count FROM public.orgill_products
						WHERE "category-title-description" ILIKE $1
					`;
					rawItems = await this.dataSource.query(query, [`%${category}%`, offset, limit]);
					countResult = await this.dataSource.query(countQuery, [`%${category}%`]);
					total = countResult[0] ? parseInt(countResult[0].count) : 0;
				}

				// 3. If still no results, fallback to random products
				if (rawItems.length === 0) {
					query = `
						SELECT * FROM public.orgill_products
						ORDER BY RANDOM()
						OFFSET $1 LIMIT $2
					`;
					countQuery = `
						SELECT COUNT(*) as count FROM public.orgill_products
					`;
					rawItems = await this.dataSource.query(query, [offset, limit]);
					countResult = await this.dataSource.query(countQuery);
					total = countResult[0] ? parseInt(countResult[0].count) : 0;
				}

				// Map raw SQL fields to camelCase property names expected by the frontend
				// Filter out duplicate SKUs (keep first occurrence)
				const seenSkus = new Set();
				const items: any[] = [];
				for (const row of rawItems) {
					const sku = row.sku;
					if (seenSkus.has(sku)) continue;
					seenSkus.add(sku);
					const itemImage1 = row['item-image-item-image1'];
					const itemImage2 = row['item-image-item-image2'];
					const itemImage3 = row['item-image-item-image3'];
					const itemImage4 = row['item-image-item-image4'];
					let mainImage = itemImage2 || itemImage1 || itemImage3 || itemImage4;
					if (!mainImage) {
						mainImage = `/images/products/${row.sku}.jpg`;
					}
					items.push({
						id: row.sku,
						sku: row.sku,
						brandName: row['brand-name'],
						modelNumber: row['model-number'],
						categoryTitleDescription: row['category-title-description'],
						onlineTitleDescription: row['online-title-description'],
						onlineLongDescription: row['online-long-description'],
						itemImage1,
						itemImage2,
						itemImage3,
						itemImage4,
						mainImage,
						price: row.price,
						...row
					});
				}
				console.log(`[getProductsByCategory] category=${category}, page=${page}, limit=${limit}, total=${total}, itemsReturned=${items.length}`);
				return this.paginate(items, total, { page, limit, sortBy, sortOrder });
			}

	// Get products by brand with pagination
	async getProductsByBrand(brand: string, pagination: PaginationDto): Promise<PaginatedResponseDto<Product>> {
		const { page, limit, sortBy, sortOrder } = this.getPaginationDefaults(pagination);
		const [items, total] = await this.productRepository.findAndCount({
			where: { brandName: ILike(`%${brand}%`) },
			skip: (page - 1) * limit,
			take: limit,
			order: { [sortBy as string]: sortOrder },
		});
		return this.paginate(items, total, { page, limit, sortBy, sortOrder });
	}

	// Get product counts for specific categories (example: hardcoded list)
	async getSpecificCategoryProductCounts(): Promise<Record<string, number>> {
		try {
			const specificCategories = [
				'Building', 'Materials', 'Tools', 'Hardware', 'Plumbing', 'Electrical',
				'Flooring', 'Roofing', 'Gutters', 'Paint', 'Decor', 'Safety',
				'Workwear', 'Landscaping', 'Outdoor', 'HVAC'
			];
			const categoryCounts: Record<string, number> = {};
			for (const category of specificCategories) {
				const query = `
					SELECT COUNT(*) as count
					FROM public.orgill_products
					WHERE "category-title-description" ILIKE ANY (
						ARRAY['%${category}%']
					)
				`;
								const result = await this.dataSource.query(query);
								categoryCounts[category] = result[0] ? parseInt(result[0].count) : 0;
			}
			return categoryCounts;
		} catch (error) {
			const specificCategories = [
				'Building', 'Materials', 'Tools', 'Hardware', 'Plumbing', 'Electrical',
				'Flooring', 'Roofing', 'Gutters', 'Paint', 'Decor', 'Safety',
				'Workwear', 'Landscaping', 'Outdoor', 'HVAC'
			];
			return specificCategories.reduce((acc, category) => {
				acc[category] = 0;
				return acc;
			}, {} as Record<string, number>);
		}
	}

	// Create a new product
	async create(dto: CreateProductDto): Promise<Product> {
		const entity = this.productRepository.create(dto);
		return this.productRepository.save(entity);
	}

	// Search products by query string
	async searchProducts(query: string, pagination: PaginationDto): Promise<PaginatedResponseDto<Product>> {
		const { page, limit, sortBy, sortOrder } = this.getPaginationDefaults(pagination);
		const [items, total] = await this.productRepository.findAndCount({
			where: [
				{ onlineTitleDescription: ILike(`%${query}%`) },
				{ brandName: ILike(`%${query}%`) },
				{ modelNumber: ILike(`%${query}%`) },
			],
			skip: (page - 1) * limit,
			take: limit,
			order: { [sortBy as string]: sortOrder },
		});
		return this.paginate(items, total, { page, limit, sortBy, sortOrder });
	}

	// Get all products with pagination
	async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Product>> {
		const { page, limit, sortBy, sortOrder } = this.getPaginationDefaults(pagination);
		const [items, total] = await this.productRepository.findAndCount({
			skip: (page - 1) * limit,
			take: limit,
			order: { [sortBy as string]: sortOrder },
		});
		console.log(`[ProductService] findAll: page=${page}, limit=${limit}, total=${total}, itemsReturned=${items.length}`);
		return this.paginate(items, total, { page, limit, sortBy, sortOrder });
	}

	// Get a single product by id
	async findOne(id: string): Promise<Product | null> {
		return this.productRepository.findOne({ where: { id } });
	}

	// Update a product
	async update(id: string, dto: UpdateProductDto): Promise<Product | null> {
		await this.productRepository.update(id, dto as Partial<Product>);
		return this.findOne(id);
	}

	// Remove a product
	async remove(id: string): Promise<void> {
		await this.productRepository.delete(id);
	}

	// Get live product data from CounterPoint
	async getByIdFromCounterPoint(id: string) {
		return this.cp.getItemBySku(id);
	}

	// Helper for paginated response
	private paginate<T>(items: T[], total: number, pagination: PaginationDto): PaginatedResponseDto<T> {
		const { page = 1, limit = 10 } = pagination;
		const totalPages = Math.ceil(total / limit);
		return {
			items,
			meta: {
				totalItems: total,
				itemCount: items.length,
				itemsPerPage: limit,
				totalPages,
				currentPage: page,
			},
			links: {
				first: `?page=1&limit=${limit}`,
				previous: page > 1 ? `?page=${page - 1}&limit=${limit}` : '',
				next: page < totalPages ? `?page=${page + 1}&limit=${limit}` : '',
				last: `?page=${totalPages}&limit=${limit}`,
			},
		};
	}
}
