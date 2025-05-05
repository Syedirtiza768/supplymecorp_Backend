import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto, AttributeDto, NumericAttributeDto } from './dto/product.dto';
import { PaginationDto, PaginatedResponseDto, SortOrder } from './dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Helper method to process attributes
  private processAttributes(
    textAttributes?: AttributeDto[],
    numericAttributes?: NumericAttributeDto[],
  ) {
    const textAttrs: Record<string, { value: string; uom?: string }> = {};
    const numericAttrs: Record<string, { value: number; uom?: number }> = {};

    if (textAttributes && textAttributes.length > 0) {
      textAttributes.forEach(attr => {
        textAttrs[attr.name] = {
          value: attr.value,
          uom: attr.uom,
        };
      });
    }

    if (numericAttributes && numericAttributes.length > 0) {
      numericAttributes.forEach(attr => {
        numericAttrs[attr.name] = {
          value: attr.value,
          uom: attr.uom,
        };
      });
    }

    return { textAttrs, numericAttrs };
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { textAttributes, numericAttributes, ...productData } = createProductDto;
    const { textAttrs, numericAttrs } = this.processAttributes(
      textAttributes,
      numericAttributes,
    );

    const product = this.productRepository.create({
      ...productData,
      textAttributes: textAttrs,
      numericAttributes: numericAttrs,
    });

    return this.productRepository.save(product);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Product>> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = SortOrder.DESC, search } = paginationDto;
    
    // Calculate offset for pagination
    const skip = (page - 1) * limit;
    
    // Create sorting options
    const order: FindOptionsOrder<Product> = { [sortBy]: sortOrder };
    
    // Create where options if search term is provided
    let whereOptions: FindOptionsWhere<Product> | FindOptionsWhere<Product>[] = {};
    
    if (search) {
      whereOptions = [
        { brandName: Like(`%${search}%`) },
        { modelNumber: Like(`%${search}%`) },
        { categoryTitleDescription: Like(`%${search}%`) },
        { onlineTitleDescription: Like(`%${search}%`) },
        { onlineLongDescription: Like(`%${search}%`) },
      ];
    }
    
    // Get products with count
    const [items, totalItems] = await this.productRepository.findAndCount({
      where: whereOptions,
      order,
      skip,
      take: limit,
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
      links: {
        first: `/api/products?page=1&limit=${limit}`,
        previous: page > 1 ? `/api/products?page=${page - 1}&limit=${limit}` : '',
        next: page < totalPages ? `/api/products?page=${page + 1}&limit=${limit}` : '',
        last: totalPages > 0 ? `/api/products?page=${totalPages}&limit=${limit}` : '',
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const { textAttributes, numericAttributes, ...productData } = updateProductDto;
    
    const product = await this.findOne(id);
    
    if (textAttributes || numericAttributes) {
      const { textAttrs, numericAttrs } = this.processAttributes(
        textAttributes,
        numericAttributes,
      );
      
      if (textAttributes) {
        product.textAttributes = {
          ...product.textAttributes,
          ...textAttrs,
        };
      }
      
      if (numericAttributes) {
        product.numericAttributes = {
          ...product.numericAttributes,
          ...numericAttrs,
        };
      }
    }
    
    // Update basic product data
    Object.assign(product, productData);
    
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  // Advanced search functionality
  async search(
    query: string,
    filters: Record<string, any> = {},
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Product>> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = SortOrder.DESC } = paginationDto;
    
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    
    // Apply search if query is provided
    if (query) {
      queryBuilder.where(
        '(product."brandName" ILIKE :query OR ' +
        'product."modelNumber" ILIKE :query OR ' +
        'product."categoryTitleDescription" ILIKE :query OR ' +
        'product."onlineTitleDescription" ILIKE :query OR ' +
        'product."onlineLongDescription" ILIKE :query)',
        { query: `%${query}%` },
      );
    }
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key] && this.isValidColumn(key)) {
        queryBuilder.andWhere(`product."${key}" = :${key}`, { [key]: filters[key] });
      }
    });
    
    // Apply sorting
    if (this.isValidColumn(sortBy)) {
      queryBuilder.orderBy(`product."${sortBy}"`, sortOrder);
    } else {
      queryBuilder.orderBy('product."id"', sortOrder);
    }
    
    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);
    
    // Execute query
    const [items, totalItems] = await queryBuilder.getManyAndCount();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    
    // Return paginated result
    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
      links: {
        first: `/api/products/search?page=1&limit=${limit}`,
        previous: page > 1 ? `/api/products/search?page=${page - 1}&limit=${limit}` : '',
        next: page < totalPages ? `/api/products/search?page=${page + 1}&limit=${limit}` : '',
        last: totalPages > 0 ? `/api/products/search?page=${totalPages}&limit=${limit}` : '',
      },
    };
  }

  // Helper method to prevent SQL injection by validating column names
  private isValidColumn(column: string): boolean {
    const validColumns = [
      'id', 'categoryCode', 'upcCode', 'sku', 'modelNumber', 'brandName',
      'categoryTitleDescription', 'onlineTitleDescription', 'onlineLongDescription'
    ];
    return validColumns.includes(column);
  }
}