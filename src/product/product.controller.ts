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
  } from '@nestjs/common';
  import { ProductService } from './product.service';
  import { Product } from './product.entity';
  import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
  import { PaginationDto, PaginatedResponseDto } from './dto/pagination.dto';
  
  @Controller('products')
  @UseInterceptors(ClassSerializerInterceptor)
  export class ProductController {
    constructor(private readonly productService: ProductService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createProductDto: CreateProductDto): Promise<Product> {
      return this.productService.create(createProductDto);
    }
  
    @Get()
    findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<Product>> {
      return this.productService.findAll(paginationDto);
    }
  
    @Get('search')
    search(
      @Query('query') query: string,
      @Query() paginationDto: PaginationDto,
      @Query() filters: Record<string, any>,
    ): Promise<PaginatedResponseDto<Product>> {
      // Remove pagination params from filters
      const { page, limit, sortBy, sortOrder, search, query: q, ...actualFilters } = filters;
      
      return this.productService.search(
        query || search,
        actualFilters,
        paginationDto,
      );
    }
  
    @Get(':id')
    findOne(@Param('id') id: string): Promise<Product> {
      return this.productService.findOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() updateProductDto: UpdateProductDto,
    ): Promise<Product> {
      return this.productService.update(id, updateProductDto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string): Promise<void> {
      return this.productService.remove(id);
    }
  }