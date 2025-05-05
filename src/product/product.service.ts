import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto, AttributeDto, NumericAttributeDto } from './dto/product.dto';
import { PaginationDto, PaginatedResponseDto, SortOrder } from './dto/pagination.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Helper method to update entity with attributes
  private applyAttributesToEntity(
    product: Product,
    textAttributes?: AttributeDto[],
    numericAttributes?: NumericAttributeDto[],
  ): Product {
    // Process text attributes (1-32)
    if (textAttributes && textAttributes.length > 0) {
      // Reset any attribute index counter
      let textAttrCounter = 1;
      
      textAttributes.forEach(attr => {
        if (textAttrCounter <= 32) {
          // Use type assertion to tell TypeScript this is valid
          (product as any)[`attributeName${textAttrCounter}`] = attr.name;
          (product as any)[`attributeValue${textAttrCounter}`] = attr.value;
          (product as any)[`attributeValueUom${textAttrCounter}`] = attr.uom || null;
          
          textAttrCounter++;
        }
      });
    }
    
    // Process numeric attributes (33-50)
    if (numericAttributes && numericAttributes.length > 0) {
      // Start from 33 for numeric attributes
      let numericAttrCounter = 33;
      
      numericAttributes.forEach(attr => {
        if (numericAttrCounter <= 50) {
          // Use type assertion to tell TypeScript this is valid
          (product as any)[`attributeName${numericAttrCounter}`] = attr.name;
          (product as any)[`attributeValue${numericAttrCounter}`] = attr.value;
          (product as any)[`attributeValueUom${numericAttrCounter}`] = attr.uom?.toString() || null;
          
          numericAttrCounter++;
        }
      });
    }
    
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const { textAttributes, numericAttributes, ...productData } = createProductDto;
      
      // Make sure we have a SKU for the primary key
      if (!productData.sku) {
        throw new Error('SKU is required as it is used as the primary key');
      }
      
      // Create a new product with the basic fields
      let product = this.productRepository.create(productData);
      product.id = productData.sku; // Set the ID to match the SKU (our primary key)
      
      // Apply attributes to the entity
      product = this.applyAttributesToEntity(product, textAttributes, numericAttributes);
      
      // Save the product
      return this.productRepository.save(product);
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Product>> {
    try {
      const { page = 1, limit = 10, sortBy = 'id', sortOrder = SortOrder.DESC, search } = paginationDto;
      
      // Calculate offset for pagination
      const skip = (page - 1) * limit;
      
      // Create sorting options - handle the special case for 'id'
      const order: FindOptionsOrder<Product> = { };
      
      // If sortBy is 'id', sort by 'id' which is our primary key
      if (sortBy === 'id') {
        order['id'] = sortOrder;
      } else {
        order[sortBy] = sortOrder;
      }
      
      // Create where options if search term is provided
      let whereOptions: FindOptionsWhere<Product>[] = [];
      
      if (search && search.trim() !== '') {
        whereOptions = [
          { brandName: ILike(`%${search}%`) },
          { modelNumber: ILike(`%${search}%`) },
          { categoryTitleDescription: ILike(`%${search}%`) },
          { onlineTitleDescription: ILike(`%${search}%`) },
          { onlineLongDescription: ILike(`%${search}%`) }
        ];
      }
      
      // Get products with count
      const [items, totalItems] = await this.productRepository.findAndCount({
        where: whereOptions.length > 0 ? whereOptions : {},
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
    } catch (error) {
      this.logger.error(`Error finding all products: ${error.message}`, error.stack);
      
      // Return empty result on error
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: paginationDto.limit || 10,
          totalPages: 0,
          currentPage: paginationDto.page || 1,
        },
        links: {
          first: '',
          previous: '',
          next: '',
          last: '',
        },
      };
    }
  }

  async findOne(id: string): Promise<Product> {
    try {
      this.logger.debug(`Finding product with id: ${id}`);
      
      const product = await this.productRepository.findOne({ 
        where: { id } 
      });
      
      if (!product) {
        this.logger.warn(`Product with id ${id} not found`);
        throw new NotFoundException(`Product with SKU ${id} not found`);
      }
      
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding product with id ${id}: ${error.message}`, error.stack);
      throw new NotFoundException(`Product with SKU ${id} not found or could not be retrieved`);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const { textAttributes, numericAttributes, ...productData } = updateProductDto;
      
      const product = await this.findOne(id);
      
      // Update basic product data
      Object.assign(product, productData);
      
      // Update attributes if provided
      if (textAttributes || numericAttributes) {
        this.applyAttributesToEntity(
          product,
          textAttributes,
          numericAttributes
        );
      }
      
      return this.productRepository.save(product);
    } catch (error) {
      this.logger.error(`Error updating product with id ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.productRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Product with SKU ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error removing product with id ${id}: ${error.message}`, error.stack);
      throw new NotFoundException(`Product with SKU ${id} not found or could not be deleted`);
    }
  }

  // Simplified search method specifically for the search endpoint
  async searchProducts(
    query: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Product>> {
    try {
      const { page = 1, limit = 10, sortBy = 'id', sortOrder = SortOrder.DESC } = paginationDto;
      
      this.logger.debug(`Searching products with query: "${query}"`);
      
      // Use findAndCount with OR conditions
      const whereConditions: FindOptionsWhere<Product>[] = [];
      
      // Only add conditions if we have a query
      if (query && query.trim() !== '') {
        whereConditions.push({ id: ILike(`%${query}%`) }); // Search by SKU
        whereConditions.push({ upcCode: ILike(`%${query}%`) }); // Search by UPC
        whereConditions.push({ brandName: ILike(`%${query}%`) }); // Search by brand
        whereConditions.push({ modelNumber: ILike(`%${query}%`) }); // Search by model
        whereConditions.push({ categoryTitleDescription: ILike(`%${query}%`) }); // Search by category
        whereConditions.push({ onlineTitleDescription: ILike(`%${query}%`) }); // Search by title
        whereConditions.push({ onlineLongDescription: ILike(`%${query}%`) }); // Search by description
      }
      
      const options = {
        where: whereConditions.length > 0 ? whereConditions : {},
        skip: (page - 1) * limit,
        take: limit,
        order: { [sortBy === 'id' ? 'id' : sortBy]: sortOrder }
      };
      
      this.logger.debug(`Search query options: ${JSON.stringify(options)}`);
      
      const [items, totalItems] = await this.productRepository.findAndCount(options);
      
      this.logger.debug(`Search found ${totalItems} total items, returning ${items.length} items`);
      
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
          first: `/api/products/search?query=${query}&page=1&limit=${limit}`,
          previous: page > 1 ? `/api/products/search?query=${query}&page=${page - 1}&limit=${limit}` : '',
          next: page < totalPages ? `/api/products/search?query=${query}&page=${page + 1}&limit=${limit}` : '',
          last: totalPages > 0 ? `/api/products/search?query=${query}&page=${totalPages}&limit=${limit}` : '',
        },
      };
    } catch (error) {
      this.logger.error(`Error searching products: ${error.message}`, error.stack);
      
      // Return empty result on error
      const { page = 1, limit = 10 } = paginationDto;
      
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: 0,
          currentPage: page,
        },
        links: {
          first: `/api/products/search?query=${query}&page=1&limit=${limit}`,
          previous: '',
          next: '',
          last: '',
        },
      };
    }
  }
}