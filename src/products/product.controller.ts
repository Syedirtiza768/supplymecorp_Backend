import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  // Additive route: only one handler for this exact path should exist in the app.
  @Get(':sku/merged')
  async getMerged(@Param('sku') sku: string) {
    const product = await this.service.getUnifiedProduct(sku);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
