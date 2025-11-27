import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpStatus,
  HttpCode,
  Logger,
  DefaultValuePipe,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto, PaginatedResponseDto, SortOrder } from './dto/pagination.dto';

@Controller('products')
@UseInterceptors(ClassSerializerInterceptor)
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * Quick product search for autocomplete (returns flat array)
   */
  @Get('quick-search')
  async quickSearch(@Query('query', new DefaultValuePipe('')) query: string): Promise<{ sku: string; name: string; price?: number }[]> {
    return this.productService.quickSearchProducts(query);
  }

  /** --------------------- NEW ENDPOINTS: Most Viewed, New, Featured --------------------- */
  @Get('new')
  async getNewProducts(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.productService.getNewProducts(limitNum);
  }

  @Get('most-viewed')
  async getMostViewed(
    @Query('limit') limit?: string,
    @Query('days') days?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 12;
    const daysNum = days ? parseInt(days, 10) : undefined;
    return this.productService.getMostViewed(limitNum, daysNum);
  }


  @Get('featured')
  async getFeaturedProducts(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.productService.getFeaturedProducts(limitNum);
  }

  /**
   * Get the product with the highest SKU for the top 5 categories
   */
  @Get('new-by-category')
  async getNewByCategory() {
    return this.productService.getHighestSkuProductsForTopCategories(5);
  }

  /** --------------------- FILTERS: categories & brands --------------------- */
  @Get('filters/categories')
  getAllCategories(): Promise<string[]> {
    return this.productService.getAllCategories();
  }

  @Get('filters/brands')
  getAllBrands(): Promise<string[]> {
    return this.productService.getAllBrands();
  }

  @Get('filters/by-category/:category')
  getProductsByCategory(
    @Param('category') category: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('id')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe(SortOrder.DESC), new ParseEnumPipe(SortOrder)) sortOrder: SortOrder,
  ): Promise<PaginatedResponseDto<Product>> {
    const paginationDto: PaginationDto = { page, limit, sortBy, sortOrder };
    return this.productService.getProductsByCategory(category, paginationDto);
  }

  @Get('filters/by-brand/:brand')
  getProductsByBrand(
    @Param('brand') brand: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('id')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe(SortOrder.DESC), new ParseEnumPipe(SortOrder)) sortOrder: SortOrder,
  ): Promise<PaginatedResponseDto<Product>> {
    const paginationDto: PaginationDto = { page, limit, sortBy, sortOrder };
    return this.productService.getProductsByBrand(brand, paginationDto);
  }

  @Get('filters/specific-categories/counts')
  getSpecificCategoryProductCounts(): Promise<Record<string, number>> {
    return this.productService.getSpecificCategoryProductCounts();
  }

  /** --------------------- CRUD --------------------- */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productService.create(dto);
  }

  @Get('search')
  search(
    @Query('query', new DefaultValuePipe('')) query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('id')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe(SortOrder.DESC), new ParseEnumPipe(SortOrder)) sortOrder: SortOrder,
  ): Promise<PaginatedResponseDto<Product>> {
    const paginationDto: PaginationDto = { page, limit, sortBy, sortOrder };
    return this.productService.searchProducts(query, paginationDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('id')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe(SortOrder.DESC), new ParseEnumPipe(SortOrder)) sortOrder: SortOrder,
    @Query('search', new DefaultValuePipe('')) search: string,
  ): Promise<PaginatedResponseDto<Product>> {
    const paginationDto: PaginationDto = { page, limit, sortBy, sortOrder, search };
    return this.productService.findAll(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product | null> {
    await this.productService.incrementView(id);
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<Product | null> {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.productService.remove(id);
  }

  /** --------------------- LIVE (CounterPoint) --------------------- */
  // Use this for your Next.js item details page to pull live data via Nest
  @Get('live/:id')
  getLiveFromCounterPoint(@Param('id') id: string) {
    return this.productService.getByIdFromCounterPoint(id);
  }

  /**
   * Bulk fetch CounterPoint items by SKU array
   */
  @Post('live/bulk')
  async getLiveBulkFromCounterPoint(@Body('skus') skus: string[]): Promise<any[]> {
    return this.productService.getBulkFromCounterPoint(skus);
  }

  /** --------------------- UNIFIED PRODUCT MERGE --------------------- */
  // Additive route: only one handler for this exact path should exist in the app.
  @Get(':sku/merged')
  async getMerged(@Param('sku') sku: string) {
    const product = await this.productService.getUnifiedProduct(sku);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
