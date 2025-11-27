import { Controller, Get, Query } from '@nestjs/common';

interface ProductSearchResult {
  sku: string;
  name: string;
  price?: number;
}

@Controller('products')
export class ProductsController {
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
}
