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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
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