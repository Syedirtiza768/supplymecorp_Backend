import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto, AttributeDto, NumericAttributeDto } from './dto/product.dto';
import { PaginationDto, PaginatedResponseDto, SortOrder } from './dto/pagination.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectDataSource()
    private dataSource: DataSource
  ) {
    // Log table structure on service init for debugging
    this.logTableStructure();
  }

  // Debug helper to log table structure
  private async logTableStructure() {
    try {
      const schemaQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orgill_products' 
        ORDER BY ordinal_position
      `;
      const columns = await this.dataSource.query(schemaQuery);
      this.logger.debug(`Table columns: ${JSON.stringify(columns)}`);
    } catch (e) {
      this.logger.error(`Failed to get schema info: ${e.message}`);
    }
  }

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

      // Build the SQL query for products
      let sqlQuery = 'SELECT * FROM orgill_products';
      const params: any[] = [];
      
      // Add search condition if provided
      if (search && search.trim() !== '') {
        sqlQuery += ` WHERE "brand-name" ILIKE $1`;
        params.push(`%${search}%`);
      }
      
      // Add ordering - Special handling for id to use sku column
      if (sortBy === 'id') {
        sqlQuery += ` ORDER BY sku ${sortOrder}`;
      } else {
        // Convert camelCase to hyphenated for column names
        const dbColumn = this.convertCamelToHyphen(sortBy);
        sqlQuery += ` ORDER BY "${dbColumn}" ${sortOrder}`;
      }
      
      // Add pagination
      sqlQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, skip);
      
      // Log the SQL for debugging
      this.logger.debug(`Raw SQL query: ${sqlQuery} with params: ${params.join(', ')}`);
      
      // Execute the SQL query
      const items = await this.dataSource.query(sqlQuery, params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as count FROM orgill_products';
      const countParams: any[] = [];
      
      if (search && search.trim() !== '') {
        countQuery += ` WHERE "brand-name" ILIKE $1`;
        countParams.push(`%${search}%`);
      }
      
      // Execute count query
      const countResult = await this.dataSource.query(countQuery, countParams);
      
      const totalItems = parseInt(countResult[0]?.count || '0');
      
      // Create product entities from raw data
      const productEntities = items.map(item => this.mapToProductEntity(item));
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        items: productEntities,
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
      
      const sqlQuery = 'SELECT * FROM orgill_products WHERE sku = $1';
      const result = await this.dataSource.query(sqlQuery, [id]);
      
      if (!result || result.length === 0) {
        this.logger.warn(`Product with id ${id} not found`);
        throw new NotFoundException(`Product with SKU ${id} not found`);
      }
      
      return this.mapToProductEntity(result[0]);
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
      const sqlQuery = 'DELETE FROM orgill_products WHERE sku = $1';
      const result = await this.dataSource.query(sqlQuery, [id]);
      
      if (!result || result.affectedRows === 0) {
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

  async searchProducts(
    query: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Product>> {
    try {
      const { page = 1, limit = 10, sortBy = 'id', sortOrder = SortOrder.DESC } = paginationDto;
      
      this.logger.log(`Searching products with query: "${query}"`);
      
      // Calculate offset for pagination
      const skip = (page - 1) * limit;
      
      // Build the SQL query for search - SIMPLIFIED to only search brand-name
      let sqlQuery = 'SELECT * FROM orgill_products';
      const params: any[] = [];
      
      // Add search condition if provided - ONLY search brand-name
      if (query && query.trim() !== '') {
        sqlQuery += ` WHERE "brand-name" ILIKE $1`;
        params.push(`%${query}%`);
      }
      
      // Add ordering - Special handling for id to use sku column
      if (sortBy === 'id') {
        sqlQuery += ` ORDER BY sku ${sortOrder}`;
      } else {
        // Convert camelCase to hyphenated for column names
        const dbColumn = this.convertCamelToHyphen(sortBy);
        sqlQuery += ` ORDER BY "${dbColumn}" ${sortOrder}`;
      }
      
      // Add pagination
      sqlQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, skip);
      
      // Log the SQL for debugging
      this.logger.debug(`Raw SQL search query: ${sqlQuery} with params: ${params.join(', ')}`);
      
      // Execute the SQL query
      const items = await this.dataSource.query(sqlQuery, params);
      
      // Get total count for pagination - has to match the search query logic
      let countQuery = 'SELECT COUNT(*) as count FROM orgill_products';
      const countParams: any[] = [];
      
      if (query && query.trim() !== '') {
        countQuery += ` WHERE "brand-name" ILIKE $1`;
        countParams.push(`%${query}%`);
      }
      
      // Execute count query
      const countResult = await this.dataSource.query(countQuery, countParams);
      
      const totalItems = parseInt(countResult[0]?.count || '0');
      
      // Create product entities from raw data
      const productEntities = items.map(item => this.mapToProductEntity(item));
      
      this.logger.log(`Search found ${totalItems} items, returning ${items.length} items`);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        items: productEntities,
        meta: {
          totalItems,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
        links: {
          first: `/api/products/search?query=${encodeURIComponent(query)}&page=1&limit=${limit}`,
          previous: page > 1 ? `/api/products/search?query=${encodeURIComponent(query)}&page=${page - 1}&limit=${limit}` : '',
          next: page < totalPages ? `/api/products/search?query=${encodeURIComponent(query)}&page=${page + 1}&limit=${limit}` : '',
          last: totalPages > 0 ? `/api/products/search?query=${encodeURIComponent(query)}&page=${totalPages}&limit=${limit}` : '',
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
          first: `/api/products/search?query=${encodeURIComponent(query)}&page=1&limit=${limit}`,
          previous: '',
          next: '',
          last: '',
        },
      };
    }
  }
  
  // NEW METHODS FOR FILTERS
  
  async getAllCategories(): Promise<string[]> {
    try {
      this.logger.log('Fetching all unique category title descriptions');
      
      // Query to get all unique category title descriptions, excluding nulls
      const query = `
        SELECT DISTINCT "category-title-description" 
        FROM orgill_products 
        WHERE "category-title-description" IS NOT NULL 
        ORDER BY "category-title-description" ASC
      `;
      
      const results = await this.dataSource.query(query);
      
      // Extract the values from the result objects
      return results.map(result => result['category-title-description']);
    } catch (error) {
      this.logger.error(`Error fetching categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllBrands(): Promise<string[]> {
    try {
      this.logger.log('Fetching all unique brand names');
      
      // Query to get all unique brand names, excluding nulls
      const query = `
        SELECT DISTINCT "brand-name" 
        FROM orgill_products 
        WHERE "brand-name" IS NOT NULL 
        ORDER BY "brand-name" ASC
      `;
      
      const results = await this.dataSource.query(query);
      
      // Extract the values from the result objects
      return results.map(result => result['brand-name']);
    } catch (error) {
      this.logger.error(`Error fetching brands: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getProductsByCategory(
    category: string,
    paginationDto: PaginationDto
  ): Promise<PaginatedResponseDto<Product>> {
    try {
      const { page = 1, limit = 10, sortBy = 'id', sortOrder = SortOrder.DESC } = paginationDto;
      
      this.logger.log(`Finding products with category containing: "${category}"`);
      
      // Calculate offset for pagination
      const skip = (page - 1) * limit;
      
      // Build the SQL query using ILIKE with pattern matching
      let sqlQuery = `
        SELECT * 
        FROM orgill_products
        WHERE "category-title-description" ILIKE ANY (
          ARRAY['%' || $1 || '%']
        )
      `;
      const params: any[] = [category];
      
      // Add ordering - Special handling for id to use sku column
      if (sortBy === 'id') {
        sqlQuery += ` ORDER BY sku ${sortOrder}`;
      } else {
        // Convert camelCase to hyphenated for column names
        const dbColumn = this.convertCamelToHyphen(sortBy);
        sqlQuery += ` ORDER BY "${dbColumn}" ${sortOrder}`;
      }
      
      // Add pagination
      sqlQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, skip);
      
      // Execute the SQL query
      const items = await this.dataSource.query(sqlQuery, params);
      
      // Get total count for pagination using the same WHERE condition
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM orgill_products 
        WHERE "category-title-description" ILIKE ANY (
          ARRAY['%' || $1 || '%']
        )
      `;
      const countResult = await this.dataSource.query(countQuery, [category]);
      
      const totalItems = parseInt(countResult[0]?.count || '0');
      
      // Create product entities from raw data
      const productEntities = items.map(item => this.mapToProductEntity(item));
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        items: productEntities,
        meta: {
          totalItems,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
        links: {
          first: `/api/products/filters/by-category/${encodeURIComponent(category)}?page=1&limit=${limit}`,
          previous: page > 1 ? `/api/products/filters/by-category/${encodeURIComponent(category)}?page=${page - 1}&limit=${limit}` : '',
          next: page < totalPages ? `/api/products/filters/by-category/${encodeURIComponent(category)}?page=${page + 1}&limit=${limit}` : '',
          last: totalPages > 0 ? `/api/products/filters/by-category/${encodeURIComponent(category)}?page=${totalPages}&limit=${limit}` : '',
        },
      };
    } catch (error) {
      this.logger.error(`Error finding products by category: ${error.message}`, error.stack);
      
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
          first: `/api/products/filters/by-category/${encodeURIComponent(category)}?page=1&limit=${limit}`,
          previous: '',
          next: '',
          last: '',
        },
      };
    }
  }

  async getProductsByBrand(
    brand: string,
    paginationDto: PaginationDto
  ): Promise<PaginatedResponseDto<Product>> {
    try {
      const { page = 1, limit = 10, sortBy = 'id', sortOrder = SortOrder.DESC } = paginationDto;
      
      this.logger.log(`Finding products with brand containing: "${brand}"`);
      
      // Calculate offset for pagination
      const skip = (page - 1) * limit;
      
      // Build the SQL query using ILIKE with pattern matching
      let sqlQuery = `
        SELECT * 
        FROM orgill_products
        WHERE "brand-name" ILIKE ANY (
          ARRAY['%' || $1 || '%']
        )
      `;
      const params: any[] = [brand];
      
      // Add ordering - Special handling for id to use sku column
      if (sortBy === 'id') {
        sqlQuery += ` ORDER BY sku ${sortOrder}`;
      } else {
        // Convert camelCase to hyphenated for column names
        const dbColumn = this.convertCamelToHyphen(sortBy);
        sqlQuery += ` ORDER BY "${dbColumn}" ${sortOrder}`;
      }
      
      // Add pagination
      sqlQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, skip);
      
      // Execute the SQL query
      const items = await this.dataSource.query(sqlQuery, params);
      
      // Get total count for pagination using the same WHERE condition
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM orgill_products 
        WHERE "brand-name" ILIKE ANY (
          ARRAY['%' || $1 || '%']
        )
      `;
      const countResult = await this.dataSource.query(countQuery, [brand]);
      
      const totalItems = parseInt(countResult[0]?.count || '0');
      
      // Create product entities from raw data
      const productEntities = items.map(item => this.mapToProductEntity(item));
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        items: productEntities,
        meta: {
          totalItems,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
        links: {
          first: `/api/products/filters/by-brand/${encodeURIComponent(brand)}?page=1&limit=${limit}`,
          previous: page > 1 ? `/api/products/filters/by-brand/${encodeURIComponent(brand)}?page=${page - 1}&limit=${limit}` : '',
          next: page < totalPages ? `/api/products/filters/by-brand/${encodeURIComponent(brand)}?page=${page + 1}&limit=${limit}` : '',
          last: totalPages > 0 ? `/api/products/filters/by-brand/${encodeURIComponent(brand)}?page=${totalPages}&limit=${limit}` : '',
        },
      };
    } catch (error) {
      this.logger.error(`Error finding products by brand: ${error.message}`, error.stack);
      
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
          first: `/api/products/filters/by-brand/${encodeURIComponent(brand)}?page=1&limit=${limit}`,
          previous: '',
          next: '',
          last: '',
        },
      };
    }
  }
  
  // Helper method to map raw database rows to Product entities
  private mapToProductEntity(rawItem: any): Product {
    const product = new Product();
    
    // Map each property from raw data to the product entity
    Object.keys(rawItem).forEach(key => {
      // Convert hyphenated database column names to camelCase property names
      const propName = this.convertHyphenToCamel(key);
      product[propName] = rawItem[key];
    });
    
    // Make sure the id is set correctly - in this case the id is the SKU
    product.id = rawItem.sku;
    
    return product;
  }
  
  // Helper method to convert camelCase property names to hyphenated database column names
  private convertCamelToHyphen(camelCase: string): string {
    // Special case handling for known columns
    const specialCases = {
      'upcCode': 'upc-code',
      'categoryCode': 'category-code',
      'modelNumber': 'model-number',
      'brandName': 'brand-name',
      'categoryTitleDescription': 'category-title-description',
      'onlineTitleDescription': 'online-title-description',
      'onlineLongDescription': 'online-long-description',
      'onlineFeatureBullet1': 'online-feature-bullet-1',
      'onlineFeatureBullet2': 'online-feature-bullet-2',
      'onlineFeatureBullet3': 'online-feature-bullet-3',
      'onlineFeatureBullet4': 'online-feature-bullet-4',
      'onlineFeatureBullet5': 'online-feature-bullet-5',
      'onlineFeatureBullet6': 'online-feature-bullet-6',
      'onlineFeatureBullet7': 'online-feature-bullet-7',
      'onlineFeatureBullet8': 'online-feature-bullet-8',
      'onlineFeatureBullet9': 'online-feature-bullet-9',
      'onlineFeatureBullet10': 'online-feature-bullet-10',
      'itemImage1': 'item-image-item-image1',
      'itemImage2': 'item-image-item-image2',
      'itemImage3': 'item-image-item-image3',
      'itemImage4': 'item-image-item-image4',
      'itemDocumentName1': 'item-document-name-1',
      'itemDocumentName2': 'item-document-name-2',
      'itemDocumentName3': 'item-document-name-3',
    };
    
    // Return the special case if it exists
    if (specialCases[camelCase]) {
      return specialCases[camelCase];
    }
    
    // General conversion for other cases
    return camelCase.replace(/([A-Z])/g, '-$1').toLowerCase();
  }
  
  // Helper method to convert hyphenated column names to camelCase property names
  private convertHyphenToCamel(hyphenated: string): string {
    const specialCases = {
      'upc-code': 'upcCode',
      'category-code': 'categoryCode',
      'model-number': 'modelNumber',
      'brand-name': 'brandName',
      'category-title-description': 'categoryTitleDescription',
      'online-title-description': 'onlineTitleDescription',
      'online-long-description': 'onlineLongDescription',
      'online-feature-bullet-1': 'onlineFeatureBullet1',
      'online-feature-bullet-2': 'onlineFeatureBullet2',
      'online-feature-bullet-3': 'onlineFeatureBullet3',
      'online-feature-bullet-4': 'onlineFeatureBullet4',
      'online-feature-bullet-5': 'onlineFeatureBullet5',
      'online-feature-bullet-6': 'onlineFeatureBullet6',
      'online-feature-bullet-7': 'onlineFeatureBullet7',
      'online-feature-bullet-8': 'onlineFeatureBullet8',
      'online-feature-bullet-9': 'onlineFeatureBullet9',
      'online-feature-bullet-10': 'onlineFeatureBullet10',
      'item-image-item-image1': 'itemImage1',
      'item-image-item-image2': 'itemImage2',
      'item-image-item-image3': 'itemImage3',
      'item-image-item-image4': 'itemImage4',
      'item-document-name-1': 'itemDocumentName1',
      'item-document-name-2': 'itemDocumentName2',
      'item-document-name-3': 'itemDocumentName3',
    };
    
    // Return the special case if it exists
    if (specialCases[hyphenated]) {
      return specialCases[hyphenated];
    }
    
    // General conversion for other cases
    return hyphenated.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}