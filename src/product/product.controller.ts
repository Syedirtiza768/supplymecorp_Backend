import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpStatus,
  HttpCode,
  Logger,
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

  // CATEGORIES AND BRANDS ROUTES - Specific routes first
  @Get('filters/categories')
  getAllCategories(): Promise<string[]> {
    this.logger.log('Getting all product categories');
    return this.productService.getAllCategories();
  }

  @Get('filters/brands')
  getAllBrands(): Promise<string[]> {
    this.logger.log('Getting all product brands');
    return this.productService.getAllBrands();
  }

  @Get('filters/by-category/:category')
  getProductsByCategory(
    @Param('category') category: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedResponseDto<Product>> {
    this.logger.log(`Finding products with category: "${category}"`);
    
    const paginationDto: PaginationDto = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    
    return this.productService.getProductsByCategory(category, paginationDto);
  }

  @Get('filters/by-brand/:brand')
  getProductsByBrand(
    @Param('brand') brand: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedResponseDto<Product>> {
    this.logger.log(`Finding products with brand: "${brand}"`);
    
    const paginationDto: PaginationDto = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    
    return this.productService.getProductsByBrand(brand, paginationDto);
  }

  // STANDARD CRUD OPERATIONS
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`Creating new product with SKU: ${createProductDto.sku}`);
    return this.productService.create(createProductDto);
  }

  @Get('search')
  search(
    @Query('query') query: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedResponseDto<Product>> {
    const paginationDto: PaginationDto = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    
    this.logger.log(`Searching products with query: "${query}" and pagination: ${JSON.stringify(paginationDto)}`);
    return this.productService.searchProducts(query, paginationDto);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: SortOrder = SortOrder.DESC,
    @Query('search') search: string = '',
  ): Promise<PaginatedResponseDto<Product>> {
    const paginationDto: PaginationDto = {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
    };
    
    this.logger.log(`Finding all products with pagination: ${JSON.stringify(paginationDto)}`);
    return this.productService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    this.logger.log(`Finding product with id: ${id}`);
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    this.logger.log(`Updating product with id: ${id}`);
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Removing product with id: ${id}`);
    return this.productService.remove(id);
  }
}