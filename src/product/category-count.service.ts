import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CategoryCount } from './entities/category-count.entity';
import { CounterPointClient } from './counterpoint.client';

export interface CategoryCalculationResult {
  categoryName: string;
  totalInOrgill: number;
  availableInCounterpoint: number;
  withValidImages: number;
  finalCount: number;
  notes: string[];
}

@Injectable()
export class CategoryCountService {
  private readonly logger = new Logger(CategoryCountService.name);
  
  // Cache for image validation (6 hours)
  private imageCache = new Map<string, { valid: boolean; ts: number }>();
  private readonly IMAGE_CACHE_TTL = 6 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(CategoryCount)
    private readonly categoryCountRepo: Repository<CategoryCount>,
    private readonly ds: DataSource,
    private readonly cp: CounterPointClient,
  ) {}

  /**
   * Get all category counts (for public API - instant response)
   */
  async getAllCategoryCounts(): Promise<Record<string, number>> {
    const counts = await this.categoryCountRepo.find();
    const result: Record<string, number> = {};
    
    counts.forEach(cat => {
      result[cat.categoryName] = cat.itemCount;
    });
    
    return result;
  }

  /**
   * Get detailed category count info (for admin)
   */
  async getCategoryCountDetails() {
    return await this.categoryCountRepo.find({
      order: { updatedAt: 'DESC' }
    });
  }

  /**
   * Main calculation method - recalculates all category counts
   */
  async recalculateAllCategories(): Promise<CategoryCalculationResult[]> {
    const categories = [
      'Building', 'Materials', 'Tools', 'Hardware',
      'Plumbing', 'Electrical', 'Flooring', 'Roofing',
      'Gutters', 'Paint', 'Decor', 'Safety',
      'Workwear', 'Landscaping', 'Outdoor', 'HVAC'
    ];

    this.logger.log('🚀 Starting category count recalculation for all categories');
    const startTime = Date.now();
    const results: CategoryCalculationResult[] = [];

    for (const category of categories) {
      try {
        const result = await this.recalculateCategory(category);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to calculate ${category}: ${error.message}`);
        results.push({
          categoryName: category,
          totalInOrgill: 0,
          availableInCounterpoint: 0,
          withValidImages: 0,
          finalCount: 0,
          notes: [`Error: ${error.message}`]
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`✅ Completed all category calculations in ${duration}s`);
    
    return results;
  }

  /**
   * Recalculate a single category
   */
  async recalculateCategory(categoryName: string): Promise<CategoryCalculationResult> {
    this.logger.log(`🔍 Calculating counts for category: ${categoryName}`);
    const notes: string[] = [];
    
    // Mark as calculating
    await this.categoryCountRepo.upsert(
      { categoryName, isCalculating: true },
      ['categoryName']
    );

    try {
      // Step 1: Get all SKUs from Orgill for this category
      const categoryMap: { [key: string]: string } = {
        'Building': '%Building%',
        'Materials': '%Materials%',
        'Tools': '%Tools%',
        'Hardware': '%Hardware%',
        'Plumbing': '%Plumbing%',
        'Electrical': '%Electrical%',
        'Flooring': '%Flooring%',
        'Roofing': '%Roofing%',
        'Gutters': '%Gutters%',
        'Paint': '%Paint%',
        'Decor': '%Decor%',
        'Safety': '%Safety%',
        'Workwear': '%Workwear%',
        'Landscaping': '%Landscaping%',
        'Outdoor': '%Outdoor%',
        'HVAC': '%HVAC%',
      };

      const pattern = categoryMap[categoryName];
      if (!pattern) {
        throw new Error(`Unknown category: ${categoryName}`);
      }

      const orgillItems = await this.ds.query<Array<{ sku: string; image_url: string }>>(
        `
        SELECT 
          sku::text AS sku,
          "item-image-item-image1" AS image_url
        FROM public.orgill_products
        WHERE "category-title-description" ILIKE $1
        LIMIT 2000
        `,
        [pattern]
      );

      const totalInOrgill = orgillItems.length;
      notes.push(`Found ${totalInOrgill} items in Orgill`);
      this.logger.log(`  📦 ${totalInOrgill} items in Orgill for ${categoryName}`);

      if (totalInOrgill === 0) {
        await this.saveCategoryCount(categoryName, 0, 0, 0, 0, notes);
        return {
          categoryName,
          totalInOrgill: 0,
          availableInCounterpoint: 0,
          withValidImages: 0,
          finalCount: 0,
          notes
        };
      }

      // Step 2: Check Counterpoint availability (parallel with batching)
      this.logger.log(`  🔄 Checking Counterpoint availability for ${totalInOrgill} items...`);
      const cpResults = await this.checkCounterpointBatch(orgillItems.map(i => i.sku));
      const availableItems = orgillItems.filter((_, idx) => cpResults[idx]);
      const availableInCounterpoint = availableItems.length;
      
      notes.push(`${availableInCounterpoint} items available in Counterpoint`);
      this.logger.log(`  ✅ ${availableInCounterpoint} available in Counterpoint`);

      if (availableInCounterpoint === 0) {
        await this.saveCategoryCount(categoryName, totalInOrgill, 0, 0, 0, notes);
        return {
          categoryName,
          totalInOrgill,
          availableInCounterpoint: 0,
          withValidImages: 0,
          finalCount: 0,
          notes
        };
      }

      // Step 3: Validate images (parallel with batching)
      this.logger.log(`  🖼️  Validating images for ${availableInCounterpoint} items...`);
      const imageResults = await this.validateImageBatch(availableItems.map(i => i.image_url));
      const validImageCount = imageResults.filter(valid => valid).length;
      
      notes.push(`${validImageCount} items with valid images`);
      this.logger.log(`  🎨 ${validImageCount} items with valid images`);

      // Save results
      await this.saveCategoryCount(
        categoryName,
        totalInOrgill,
        availableInCounterpoint,
        validImageCount,
        validImageCount, // Final count = items with valid images
        notes
      );

      return {
        categoryName,
        totalInOrgill,
        availableInCounterpoint,
        withValidImages: validImageCount,
        finalCount: validImageCount,
        notes
      };

    } catch (error) {
      this.logger.error(`Error calculating ${categoryName}: ${error.message}`);
      await this.categoryCountRepo.update(
        { categoryName },
        { isCalculating: false }
      );
      throw error;
    }
  }

  /**
   * Check if item exists in Counterpoint
   * Don't care about IS_ECOMM_ITEM status - just check if item is found
   */
  private async checkCounterpointAvailability(sku: string): Promise<boolean> {
    try {
      const cpData = await this.cp.getItemBySku(sku);
      // Item just needs to exist in Counterpoint
      return !!cpData;
    } catch (error) {
      return false;
    }
  }

  /**
   * Batch check Counterpoint availability with concurrency control
   */
  private async checkCounterpointBatch(skus: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    const batchSize = 10; // Process 10 at a time
    
    for (let i = 0; i < skus.length; i += batchSize) {
      const batch = skus.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(sku => this.checkCounterpointAvailability(sku))
      );
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < skus.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Batch validate images with concurrency control
   */
  private async validateImageBatch(imageUrls: (string | null)[]): Promise<boolean[]> {
    const results: boolean[] = [];
    const batchSize = 20; // Process 20 at a time
    
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.validateImageUrl(url))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Validate image URL with caching
   */
  private async validateImageUrl(imageUrl: string | null): Promise<boolean> {
    if (!imageUrl) return false;
    
    // Check cache first
    const cached = this.imageCache.get(imageUrl);
    if (cached && (Date.now() - cached.ts) < this.IMAGE_CACHE_TTL) {
      return cached.valid;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        signal: controller.signal as any
      });
      
      clearTimeout(timeout);
      const valid = response.ok;
      
      // Cache the result
      this.imageCache.set(imageUrl, { valid, ts: Date.now() });
      
      return valid;
    } catch (error) {
      // Cache failure as well
      this.imageCache.set(imageUrl, { valid: false, ts: Date.now() });
      return false;
    }
  }

  /**
   * Save category count to database
   */
  private async saveCategoryCount(
    categoryName: string,
    totalInOrgill: number,
    availableInCounterpoint: number,
    withValidImages: number,
    itemCount: number,
    notes: string[]
  ): Promise<void> {
    await this.categoryCountRepo.upsert(
      {
        categoryName,
        totalInOrgill,
        availableInCounterpoint,
        withValidImages,
        itemCount,
        calculationNotes: notes.join('; '),
        isCalculating: false,
        updatedAt: new Date()
      },
      ['categoryName']
    );
  }

  /**
   * Clear image cache (useful for admin)
   */
  clearImageCache(): void {
    this.imageCache.clear();
    this.logger.log('🧹 Image cache cleared');
  }
}
