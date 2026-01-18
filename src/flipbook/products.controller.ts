import { Controller, Get, Query, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { CategoryCountService } from '../product/category-count.service';

interface ProductSearchResult {
  sku: string;
  name: string;
  price?: number;
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryCountService: CategoryCountService,
  ) {}

  @Get('search')
  async searchProducts(
    @Query('query') query?: string,
    @Query('q') q?: string,
  ): Promise<ProductSearchResult[]> {
    // Accept both `query` and shorthand `q`
    const term = (query ?? q ?? '').trim();

    // Stub implementation - replace with real product search or DB call
    const mockProducts: ProductSearchResult[] = [
      { sku: '1015573', name: 'Hose Cart', price: 123.45 },
      { sku: '1014902', name: 'Hose Reel & Cart', price: 199.0 },
      { sku: '1015001', name: 'Garden Sprinkler', price: 45.99 },
      { sku: '1015002', name: 'Watering Can', price: 25.5 },
      { sku: '1015003', name: 'Pruning Shears', price: 35.75 },
    ];

    if (!term) {
      return mockProducts;
    }

    const lowerQuery = term.toLowerCase();
    return mockProducts.filter(
      (p) =>
        p.sku.toLowerCase().includes(lowerQuery) ||
        p.name.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Get product counts for specific categories (instant - reads from pre-calculated cache)
   * Endpoint: GET /api/products/filters/specific-categories/counts
   * Used for the "Products by Category" section on the homepage
   */
  @Get('filters/specific-categories/counts')
  async getSpecificCategoryCounts(): Promise<Record<string, number>> {
    return await this.categoryCountService.getAllCategoryCounts();
  }

  /**
   * Get detailed category count information (for admin dashboard)
   * Endpoint: GET /api/products/filters/specific-categories/details
   */
  @Get('filters/specific-categories/details')
  async getCategoryCountDetails() {
    return await this.categoryCountService.getCategoryCountDetails();
  }

  /**
   * Admin endpoint: Recalculate all category counts
   * This checks Counterpoint availability and validates images
   * POST /api/products/admin/recalculate-categories
   */
  @Post('admin/recalculate-categories')
  @HttpCode(HttpStatus.OK)
  async recalculateCategories() {
    const results = await this.categoryCountService.recalculateAllCategories();
    return {
      success: true,
      message: 'Category counts recalculated successfully',
      results
    };
  }

  /**
   * Admin endpoint: Recalculate single category
   * POST /api/products/admin/recalculate-category/:categoryName
   */
  @Post('admin/recalculate-category/:categoryName')
  @HttpCode(HttpStatus.OK)
  async recalculateCategory(@Query('categoryName') categoryName: string) {
    const result = await this.categoryCountService.recalculateCategory(categoryName);
    return {
      success: true,
      message: `Category ${categoryName} recalculated successfully`,
      result
    };
  }

  /**
   * Admin endpoint: Clear image validation cache
   * POST /api/products/admin/clear-image-cache
   */
  @Post('admin/clear-image-cache')
  @HttpCode(HttpStatus.OK)
  async clearImageCache() {
    this.categoryCountService.clearImageCache();
    return {
      success: true,
      message: 'Image cache cleared successfully'
    };
  }
}

