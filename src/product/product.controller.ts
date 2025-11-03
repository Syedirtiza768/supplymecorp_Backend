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
  findOne(@Param('id') id: string): Promise<Product | null> {
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

  /** --------------------- UNIFIED PRODUCT MERGE --------------------- */
  // Additive route: only one handler for this exact path should exist in the app.
  @Get(':sku/merged')
  async getMerged(@Param('sku') sku: string) {
    const product = await this.productService.getUnifiedProduct(sku);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
