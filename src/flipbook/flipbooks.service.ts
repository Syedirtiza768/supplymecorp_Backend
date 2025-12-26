import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Flipbook } from './entities/flipbook.entity';
import { FlipbookPage } from './entities/flipbook-page.entity';
import { FlipbookHotspot } from './entities/flipbook-hotspot.entity';
import { CreateFlipbookDto } from './dto/create-flipbook.dto';
import { UpdateFlipbookDto } from './dto/update-flipbook.dto';
import { HotspotDto } from './dto/hotspot.dto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class FlipbooksService {
  constructor(
    @InjectRepository(Flipbook)
    private readonly flipbookRepository: Repository<Flipbook>,
    @InjectRepository(FlipbookPage)
    private readonly pageRepository: Repository<FlipbookPage>,
    @InjectRepository(FlipbookHotspot)
    private readonly hotspotRepository: Repository<FlipbookHotspot>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Clear cache for a specific flipbook
   */
  private async clearFlipbookCache(flipbookId: string): Promise<void> {
    await this.cacheManager.del(`flipbook-${flipbookId}-pages`);
    await this.cacheManager.del('featured-flipbook');
    // Clear all page caches for this flipbook (if we know the range)
    // In a production system, you might want to use cache tags or a more sophisticated approach
  }

  /**
   * Clear cache for a specific page
   */
  private async clearPageCache(flipbookId: string, pageNumber: number): Promise<void> {
    await this.cacheManager.del(`page-${flipbookId}-${pageNumber}`);
    await this.clearFlipbookCache(flipbookId);
  }

  /**
   * Batch load pages with hotspots to avoid N+1 queries
   */
  async batchLoadPagesWithHotspots(
    flipbookId: string,
    pageNumbers: number[],
  ): Promise<Map<number, { page: FlipbookPage; hotspots: FlipbookHotspot[] }>> {
    const pages = await this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.hotspots', 'hotspots')
      .where('page.flipbookId = :flipbookId', { flipbookId })
      .andWhere('page.pageNumber IN (:...pageNumbers)', { pageNumbers })
      .getMany();

    const result = new Map<number, { page: FlipbookPage; hotspots: FlipbookHotspot[] }>();
    for (const page of pages) {
      result.set(page.pageNumber, {
        page,
        hotspots: page.hotspots || [],
      });
    }
    return result;
  }

  /**
   * Create a new flipbook or return existing one
   */
  async createOrFindFlipbook(dto: CreateFlipbookDto): Promise<Flipbook> {
    // Use a slugified version of the title as the ID
    const slug = dto.title.replace(/[^a-zA-Z0-9-]/g, '-');
    let flipbook = await this.flipbookRepository.findOne({
      where: { id: slug },
      relations: ['pages'],
    });

    if (!flipbook) {
      flipbook = this.flipbookRepository.create({ ...dto, id: slug });
      await this.flipbookRepository.save(flipbook);
    }

    return flipbook;
  }

  /**
   * Get all flipbooks
   */
  async findAllFlipbooks(page?: number, limit?: number): Promise<Flipbook[]> {
    const queryBuilder = this.flipbookRepository
      .createQueryBuilder('flipbook')
      .leftJoinAndSelect('flipbook.pages', 'pages')
      .orderBy('flipbook.createdAt', 'DESC')
      .addOrderBy('pages.pageNumber', 'ASC');

    if (page && limit) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get flipbook by ID
   */
  async findFlipbookById(id: string, includePages = false): Promise<Flipbook> {
    const queryBuilder = this.flipbookRepository
      .createQueryBuilder('flipbook')
      .where('flipbook.id = :id', { id });

    if (includePages) {
      queryBuilder
        .leftJoinAndSelect('flipbook.pages', 'pages')
        .leftJoinAndSelect('pages.hotspots', 'hotspots')
        .orderBy('pages.pageNumber', 'ASC');
    }

    const flipbook = await queryBuilder.getOne();

    if (!flipbook) {
      throw new NotFoundException(`Flipbook with ID ${id} not found`);
    }

    return flipbook;
  }

  /**
   * Get all pages for a flipbook
   */
  async findPagesByFlipbookId(
    flipbookId: string,
    page?: number,
    limit?: number,
  ): Promise<FlipbookPage[]> {
    // Ensure flipbook exists first
    try {
      let flipbook = await this.flipbookRepository.findOne({
        where: { id: flipbookId },
      });

      if (!flipbook) {
        // Create flipbook if it doesn't exist
        flipbook = this.flipbookRepository.create({
          id: flipbookId,
          title: flipbookId,
        });
        await this.flipbookRepository.save(flipbook);
      }
    } catch (error) {
      // Ignore duplicate key error - flipbook already exists
      if (error.code !== '23505') {
        throw error;
      }
    }

    const queryBuilder = this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.hotspots', 'hotspots')
      .where('page.flipbookId = :flipbookId', { flipbookId })
      .orderBy('page.pageNumber', 'ASC');

    if (page && limit) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Upload and create a new page
   */
  async uploadPage(
    flipbookId: string,
    file: any,
    pageNumber?: number,
  ): Promise<FlipbookPage> {
    // Verify flipbook exists
    await this.findFlipbookById(flipbookId);

    // Auto-assign page number if not provided
    if (!pageNumber) {
      const lastPage = await this.pageRepository.findOne({
        where: { flipbookId },
        order: { pageNumber: 'DESC' },
      });
      pageNumber = lastPage ? lastPage.pageNumber + 1 : 1;
    }

    // Check if page number already exists
    let page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    // Save file to uploads/flipbooks (served from backend)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'flipbooks', flipbookId);
    await mkdir(uploadsDir, { recursive: true });

    const filename = `page-${pageNumber}${path.extname(file.originalname)}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, file.buffer);

    const imageUrl = `/uploads/flipbooks/${flipbookId}/${filename}`;

    if (page) {
      // Update existing page
      page.imageUrl = imageUrl;
    } else {
      // Create new page record
      page = this.pageRepository.create({
        flipbookId,
        pageNumber,
        imageUrl,
      });
    }

    const result = await this.pageRepository.save(page);
    await this.clearPageCache(flipbookId, pageNumber);
    return result;
  }

  /**
   * Get page with hotspots
   */
  async getPageWithHotspots(
    flipbookId: string,
    pageNumber: number,
  ): Promise<{ page: FlipbookPage; hotspots: FlipbookHotspot[] }> {
    // Ensure flipbook exists first
    try {
      let flipbook = await this.flipbookRepository.findOne({
        where: { id: flipbookId },
      });

      if (!flipbook) {
        // Create flipbook if it doesn't exist
        flipbook = this.flipbookRepository.create({
          id: flipbookId,
          title: flipbookId,
        });
        await this.flipbookRepository.save(flipbook);
      }
    } catch (error) {
      // Ignore duplicate key error - flipbook already exists
      if (error.code !== '23505') {
        throw error;
      }
    }

    const page = await this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.hotspots', 'hotspots')
      .where('page.flipbookId = :flipbookId', { flipbookId })
      .andWhere('page.pageNumber = :pageNumber', { pageNumber })
      .getOne();

    if (!page) {
      const fallback = this.getStaticPageImage(pageNumber);
      if (fallback) {
        const staticPage = this.pageRepository.create({
          flipbookId,
          pageNumber,
          imageUrl: `/images/flipbook/${fallback.filename}`,
        });
        await this.pageRepository.save(staticPage);

        return { page: staticPage, hotspots: [] };
      }

      throw new NotFoundException(
        `Page ${pageNumber} not found in flipbook ${flipbookId}`,
      );
    }

    return { page, hotspots: page.hotspots || [] };
  }

  /**
   * Update hotspots for a page (atomic replacement)
   */
  async updatePageHotspots(
    flipbookId: string,
    pageNumber: number,
    dtos: HotspotDto[],
  ): Promise<FlipbookHotspot[]> {
    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    if (!page) {
      throw new NotFoundException(
        `Page ${pageNumber} not found in flipbook ${flipbookId}`,
      );
    }

    // Delete all existing hotspots for this page
    await this.hotspotRepository.delete({ page: { id: page.id } });

    // Create new hotspots from DTOs
    const hotspots = dtos.map((dto) => {
      // Remove id from dto as we're creating new records
      const { id, ...hotspotData } = dto;
      return this.hotspotRepository.create({
        ...hotspotData,
        page,
      });
    });

    // Save all hotspots
    const result = await this.hotspotRepository.save(hotspots);
    await this.clearPageCache(flipbookId, pageNumber);
    return result;
  }

  /**
   * Delete a page
   */
  async deletePage(flipbookId: string, pageNumber: number): Promise<void> {
    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    if (!page) {
      throw new NotFoundException(
        `Page ${pageNumber} not found in flipbook ${flipbookId}`,
      );
    }

    await this.pageRepository.remove(page);
    await this.clearPageCache(flipbookId, pageNumber);
  }

  /**
   * Delete multiple pages by page numbers
   */
  async deletePages(flipbookId: string, pageNumbers: number[]): Promise<{ deleted: number }> {
    if (!pageNumbers || pageNumbers.length === 0) {
      return { deleted: 0 };
    }

    await this.pageRepository
      .createQueryBuilder()
      .delete()
      .where("flipbookId = :flipbookId", { flipbookId })
      .andWhere("pageNumber IN (:...pageNumbers)", { pageNumbers })
      .execute();

    // Clear cache for all deleted pages
    for (const pageNumber of pageNumbers) {
      await this.clearPageCache(flipbookId, pageNumber);
    }

    return { deleted: pageNumbers.length };
  }

  /**
   * Delete a flipbook
   */
  async deleteFlipbook(id: string): Promise<void> {
    const flipbook = await this.findFlipbookById(id);
    await this.flipbookRepository.remove(flipbook);
  }

  /**
   * Update a flipbook
   */
  async updateFlipbook(id: string, dto: UpdateFlipbookDto): Promise<Flipbook> {
    const flipbook = await this.findFlipbookById(id);
    
    if (dto.title) flipbook.title = dto.title;
    if (dto.description !== undefined) flipbook.description = dto.description;
    if (dto.isFeatured !== undefined) flipbook.isFeatured = dto.isFeatured;

    const result = await this.flipbookRepository.save(flipbook);
    await this.clearFlipbookCache(id);
    if (dto.isFeatured) {
      await this.cacheManager.del('featured-flipbook');
    }
    return result;
  }

  /**
   * Toggle featured status (only one flipbook can be featured at a time)
   */
  async toggleFeatured(id: string): Promise<Flipbook> {
    const flipbook = await this.findFlipbookById(id);
    
    if (!flipbook.isFeatured) {
      // Unfeatured all other flipbooks first
      await this.flipbookRepository.update({ isFeatured: true }, { isFeatured: false });
      flipbook.isFeatured = true;
    } else {
      flipbook.isFeatured = false;
    }

    const result = await this.flipbookRepository.save(flipbook);
    await this.cacheManager.del('featured-flipbook');
    return result;
  }

  /**
   * Get the currently featured flipbook
   */
  async getFeaturedFlipbook(): Promise<Flipbook | null> {
    return await this.flipbookRepository
      .createQueryBuilder('flipbook')
      .leftJoinAndSelect('flipbook.pages', 'pages')
      .leftJoinAndSelect('pages.hotspots', 'hotspots')
      .where('flipbook.isFeatured = :isFeatured', { isFeatured: true })
      .orderBy('pages.pageNumber', 'ASC')
      .getOne();
  }

  private getStaticPageImage(pageNumber: number) {
    const staticDir = path.join(
      process.cwd(),
      '..',
      'supplymecorp',
      'public',
      'images',
      'flipbook',
    );
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const ext of extensions) {
      const filename = `${pageNumber}.${ext}`;
      const candidate = path.join(staticDir, filename);
      if (fs.existsSync(candidate)) {
        return { filename, path: candidate };
      }
    }

    return null;
  }

  /**
   * Generate PDF from flipbook pages
   */
  async generatePDF(flipbookId: string): Promise<Buffer> {
    const flipbook = await this.findFlipbookById(flipbookId, true);
    const pages = flipbook.pages || [];

    if (!pages || pages.length === 0) {
      throw new BadRequestException('Flipbook has no pages to export');
    }

    return new Promise(async (resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        autoFirstPage: false,
        margin: 0,
        bufferPages: true, // Enable page buffering for better performance
      });

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        // Sort pages by page number
        const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

        // Process pages in batches to reduce memory usage
        const batchSize = 10;
        for (let i = 0; i < sortedPages.length; i += batchSize) {
          const batch = sortedPages.slice(i, i + batchSize);
          
          for (const page of batch) {
            try {
              let imageBuffer: Buffer;

              // Download image from URL with timeout
              if (page.imageUrl.startsWith('http')) {
                const response = await axios.get(page.imageUrl, {
                  responseType: 'arraybuffer',
                  timeout: 10000, // 10 second timeout
                  maxContentLength: 10 * 1024 * 1024, // 10MB max size
                });
                imageBuffer = Buffer.from(response.data);
              } else {
                // Local file path
                const imagePath = path.join(process.cwd(), '..', 'supplymecorp', 'public', page.imageUrl);
                if (!fs.existsSync(imagePath)) {
                  console.warn(`Image not found: ${imagePath}`);
                  continue;
                }
                // Use streaming for local files
                imageBuffer = fs.readFileSync(imagePath);
              }

              // Add page in letter size
              doc.addPage({
                size: 'LETTER',
                margin: 0,
              });

              // Fit image to page
              doc.image(imageBuffer, 0, 0, {
                fit: [doc.page.width, doc.page.height],
                align: 'center',
                valign: 'center',
              });
            } catch (pageError) {
              console.error(`Error processing page ${page.pageNumber}:`, pageError);
              // Continue with other pages
            }
          }
        }

        doc.end();
      } catch (error) {
        doc.end();
        reject(error);
      }
    });
  }

  /**
   * Duplicate a page with all its hotspots
   */
  async duplicatePage(
    flipbookId: string,
    sourcePageNumber: number,
    targetPageNumber?: number,
  ): Promise<FlipbookPage> {
    const sourcePage = await this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.hotspots', 'hotspots')
      .where('page.flipbookId = :flipbookId', { flipbookId })
      .andWhere('page.pageNumber = :pageNumber', { pageNumber: sourcePageNumber })
      .getOne();

    if (!sourcePage) {
      throw new NotFoundException(
        `Source page ${sourcePageNumber} not found in flipbook ${flipbookId}`,
      );
    }

    // Auto-assign target page number if not provided
    if (!targetPageNumber) {
      const lastPage = await this.pageRepository
        .createQueryBuilder('page')
        .where('page.flipbookId = :flipbookId', { flipbookId })
        .orderBy('page.pageNumber', 'DESC')
        .getOne();
      targetPageNumber = lastPage ? lastPage.pageNumber + 1 : 1;
    }

    // Create new page
    const newPage = this.pageRepository.create({
      flipbookId,
      pageNumber: targetPageNumber,
      imageUrl: sourcePage.imageUrl,
    });
    const savedPage = await this.pageRepository.save(newPage);

    // Duplicate hotspots
    if (sourcePage.hotspots && sourcePage.hotspots.length > 0) {
      const newHotspots = sourcePage.hotspots.map((hotspot) => {
        return this.hotspotRepository.create({
          page: savedPage,
          productSku: hotspot.productSku,
          label: hotspot.label,
          linkUrl: hotspot.linkUrl,
          x: hotspot.x,
          y: hotspot.y,
          width: hotspot.width,
          height: hotspot.height,
          zIndex: hotspot.zIndex,
          meta: hotspot.meta,
        });
      });
      await this.hotspotRepository.save(newHotspots);
    }

    await this.clearFlipbookCache(flipbookId);
    return savedPage;
  }

  /**
   * Reorder pages in bulk
   */
  async reorderPages(
    flipbookId: string,
    pageOrders: Array<{ oldPageNumber: number; newPageNumber: number }>,
  ): Promise<void> {
    // Use a transaction to ensure all updates succeed or fail together
    await this.pageRepository.manager.transaction(async (transactionalEntityManager) => {
      // Temporarily set page numbers to negative values to avoid conflicts
      for (const { oldPageNumber } of pageOrders) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(FlipbookPage)
          .set({ pageNumber: -oldPageNumber })
          .where('flipbookId = :flipbookId', { flipbookId })
          .andWhere('pageNumber = :pageNumber', { pageNumber: oldPageNumber })
          .execute();
      }

      // Now set the new page numbers
      for (const { oldPageNumber, newPageNumber } of pageOrders) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(FlipbookPage)
          .set({ pageNumber: newPageNumber })
          .where('flipbookId = :flipbookId', { flipbookId })
          .andWhere('pageNumber = :pageNumber', { pageNumber: -oldPageNumber })
          .execute();
      }
    });

    await this.clearFlipbookCache(flipbookId);
  }

  /**
   * Clone an entire flipbook with all pages and hotspots
   */
  async cloneFlipbook(
    sourceId: string,
    newTitle: string,
    newDescription?: string,
  ): Promise<Flipbook> {
    const sourceFlipbook = await this.findFlipbookById(sourceId, true);

    // Create new flipbook
    const slug = newTitle.replace(/[^a-zA-Z0-9-]/g, '-');
    const newFlipbook = this.flipbookRepository.create({
      id: slug,
      title: newTitle,
      description: newDescription || sourceFlipbook.description,
      isFeatured: false, // Never clone as featured
    });
    const savedFlipbook = await this.flipbookRepository.save(newFlipbook);

    // Clone all pages and hotspots
    if (sourceFlipbook.pages && sourceFlipbook.pages.length > 0) {
      for (const sourcePage of sourceFlipbook.pages) {
        const newPage = this.pageRepository.create({
          flipbookId: savedFlipbook.id,
          pageNumber: sourcePage.pageNumber,
          imageUrl: sourcePage.imageUrl,
        });
        const savedPage = await this.pageRepository.save(newPage);

        // Clone hotspots for this page
        if (sourcePage.hotspots && sourcePage.hotspots.length > 0) {
          const newHotspots = sourcePage.hotspots.map((hotspot) => {
            return this.hotspotRepository.create({
              page: savedPage,
              productSku: hotspot.productSku,
              label: hotspot.label,
              linkUrl: hotspot.linkUrl,
              x: hotspot.x,
              y: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              zIndex: hotspot.zIndex,
              meta: hotspot.meta,
            });
          });
          await this.hotspotRepository.save(newHotspots);
        }
      }
    }

    return savedFlipbook;
  }

  /**
   * Export flipbook as JSON (for backup/migration)
   */
  async exportFlipbookJSON(flipbookId: string): Promise<any> {
    const flipbook = await this.findFlipbookById(flipbookId, true);

    return {
      id: flipbook.id,
      title: flipbook.title,
      description: flipbook.description,
      isFeatured: flipbook.isFeatured,
      pages: flipbook.pages?.map((page) => ({
        pageNumber: page.pageNumber,
        imageUrl: page.imageUrl,
        hotspots: page.hotspots?.map((hotspot) => ({
          productSku: hotspot.productSku,
          label: hotspot.label,
          linkUrl: hotspot.linkUrl,
          x: hotspot.x,
          y: hotspot.y,
          width: hotspot.width,
          height: hotspot.height,
          zIndex: hotspot.zIndex,
          meta: hotspot.meta,
        })),
      })),
    };
  }

  /**
   * Import flipbook from JSON
   */
  async importFlipbookJSON(data: any): Promise<Flipbook> {
    const { id, title, description, isFeatured, pages } = data;

    // Create or update flipbook
    let flipbook = await this.flipbookRepository.findOne({ where: { id } });
    if (!flipbook) {
      flipbook = this.flipbookRepository.create({
        id,
        title,
        description,
        isFeatured: isFeatured || false,
      });
      await this.flipbookRepository.save(flipbook);
    }

    // Import pages and hotspots
    if (pages && Array.isArray(pages)) {
      for (const pageData of pages) {
        let page = await this.pageRepository.findOne({
          where: { flipbookId: id, pageNumber: pageData.pageNumber },
        });

        if (!page) {
          page = this.pageRepository.create({
            flipbookId: id,
            pageNumber: pageData.pageNumber,
            imageUrl: pageData.imageUrl,
          });
          await this.pageRepository.save(page);
        }

        // Import hotspots
        if (pageData.hotspots && Array.isArray(pageData.hotspots)) {
          // Clear existing hotspots
          await this.hotspotRepository.delete({ page: { id: page.id } });

          // Create new hotspots
          const newHotspots = pageData.hotspots.map((hotspotData: any) => {
            return this.hotspotRepository.create({
              page,
              productSku: hotspotData.productSku,
              label: hotspotData.label,
              linkUrl: hotspotData.linkUrl,
              x: hotspotData.x,
              y: hotspotData.y,
              width: hotspotData.width,
              height: hotspotData.height,
              zIndex: hotspotData.zIndex || 0,
              meta: hotspotData.meta,
            });
          });
          await this.hotspotRepository.save(newHotspots);
        }
      }
    }

    await this.clearFlipbookCache(id);
    return flipbook;
  }

  /**
   * Update page metadata without re-uploading
   */
  async updatePage(
    flipbookId: string,
    pageNumber: number,
    updates: { imageUrl?: string; meta?: Record<string, any> },
  ): Promise<FlipbookPage> {
    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    if (!page) {
      throw new NotFoundException(`Page ${pageNumber} not found in flipbook ${flipbookId}`);
    }

    if (updates.imageUrl) {
      page.imageUrl = updates.imageUrl;
    }

    if (updates.meta) {
      page.meta = { ...page.meta, ...updates.meta };
    }

    const savedPage = await this.pageRepository.save(page);
    await this.clearPageCache(flipbookId, pageNumber);
    return savedPage;
  }

  /**
   * Create a single hotspot
   */
  async createSingleHotspot(
    flipbookId: string,
    pageNumber: number,
    dto: HotspotDto,
  ): Promise<FlipbookHotspot> {
    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    if (!page) {
      throw new NotFoundException(`Page ${pageNumber} not found in flipbook ${flipbookId}`);
    }

    const hotspot = this.hotspotRepository.create({
      page,
      productSku: dto.productSku,
      label: dto.label,
      linkUrl: dto.linkUrl,
      x: dto.x,
      y: dto.y,
      width: dto.width,
      height: dto.height,
      zIndex: dto.zIndex || 0,
      meta: dto.meta,
    });

    const savedHotspot = await this.hotspotRepository.save(hotspot);
    await this.clearPageCache(flipbookId, pageNumber);
    return savedHotspot;
  }

  /**
   * Update a single hotspot
   */
  async updateSingleHotspot(
    hotspotId: string,
    updates: Partial<HotspotDto>,
  ): Promise<FlipbookHotspot> {
    const hotspot = await this.hotspotRepository.findOne({
      where: { id: hotspotId },
      relations: ['page'],
    });

    if (!hotspot) {
      throw new NotFoundException(`Hotspot ${hotspotId} not found`);
    }

    Object.assign(hotspot, updates);
    const savedHotspot = await this.hotspotRepository.save(hotspot);
    
    // Clear cache for the page this hotspot belongs to
    const page = await this.pageRepository.findOne({
      where: { id: hotspot.page.id },
    });
    if (page) {
      await this.clearPageCache(page.flipbookId, page.pageNumber);
    }

    return savedHotspot;
  }

  /**
   * Delete a single hotspot
   */
  async deleteSingleHotspot(hotspotId: string): Promise<{ deleted: boolean }> {
    const hotspot = await this.hotspotRepository.findOne({
      where: { id: hotspotId },
      relations: ['page'],
    });

    if (!hotspot) {
      throw new NotFoundException(`Hotspot ${hotspotId} not found`);
    }

    const page = await this.pageRepository.findOne({
      where: { id: hotspot.page.id },
    });

    await this.hotspotRepository.delete(hotspotId);

    if (page) {
      await this.clearPageCache(page.flipbookId, page.pageNumber);
    }

    return { deleted: true };
  }

  /**
   * Bulk delete hotspots
   */
  async bulkDeleteHotspots(hotspotIds: string[]): Promise<{ deleted: number }> {
    if (!hotspotIds || hotspotIds.length === 0) {
      return { deleted: 0 };
    }

    // Get all hotspots to find affected pages for cache clearing
    const hotspots = await this.hotspotRepository
      .createQueryBuilder('hotspot')
      .leftJoinAndSelect('hotspot.page', 'page')
      .where('hotspot.id IN (:...ids)', { ids: hotspotIds })
      .getMany();

    // Delete hotspots
    await this.hotspotRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids)', { ids: hotspotIds })
      .execute();

    // Clear cache for affected pages
    const affectedPages = new Set<string>();
    for (const hotspot of hotspots) {
      if (hotspot.page) {
        const page = await this.pageRepository.findOne({
          where: { id: hotspot.page.id },
        });
        if (page) {
          const cacheKey = `${page.flipbookId}-${page.pageNumber}`;
          if (!affectedPages.has(cacheKey)) {
            await this.clearPageCache(page.flipbookId, page.pageNumber);
            affectedPages.add(cacheKey);
          }
        }
      }
    }

    return { deleted: hotspots.length };
  }

  /**
   * Bulk update hotspot properties
   */
  async bulkUpdateHotspots(
    hotspotIds: string[],
    updates: Partial<HotspotDto>,
  ): Promise<FlipbookHotspot[]> {
    if (!hotspotIds || hotspotIds.length === 0) {
      return [];
    }

    // Get all hotspots
    const hotspots = await this.hotspotRepository
      .createQueryBuilder('hotspot')
      .leftJoinAndSelect('hotspot.page', 'page')
      .where('hotspot.id IN (:...ids)', { ids: hotspotIds })
      .getMany();

    if (hotspots.length === 0) {
      throw new NotFoundException('No hotspots found with provided IDs');
    }

    // Update each hotspot
    for (const hotspot of hotspots) {
      Object.assign(hotspot, updates);
    }

    const savedHotspots = await this.hotspotRepository.save(hotspots);

    // Clear cache for affected pages
    const affectedPages = new Set<string>();
    for (const hotspot of hotspots) {
      if (hotspot.page) {
        const page = await this.pageRepository.findOne({
          where: { id: hotspot.page.id },
        });
        if (page) {
          const cacheKey = `${page.flipbookId}-${page.pageNumber}`;
          if (!affectedPages.has(cacheKey)) {
            await this.clearPageCache(page.flipbookId, page.pageNumber);
            affectedPages.add(cacheKey);
          }
        }
      }
    }

    return savedHotspots;
  }

  /**
   * Paste hotspots to a page
   */
  async pasteHotspots(
    flipbookId: string,
    pageNumber: number,
    hotspotDtos: HotspotDto[],
  ): Promise<FlipbookHotspot[]> {
    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    if (!page) {
      throw new NotFoundException(`Page ${pageNumber} not found in flipbook ${flipbookId}`);
    }

    const newHotspots = hotspotDtos.map((dto) => {
      return this.hotspotRepository.create({
        page,
        productSku: dto.productSku,
        label: dto.label,
        linkUrl: dto.linkUrl,
        x: dto.x,
        y: dto.y,
        width: dto.width,
        height: dto.height,
        zIndex: dto.zIndex || 0,
        meta: dto.meta,
      });
    });

    const savedHotspots = await this.hotspotRepository.save(newHotspots);
    await this.clearPageCache(flipbookId, pageNumber);
    return savedHotspots;
  }

  /**
   * Move page up (swap with previous page)
   */
  async movePageUp(flipbookId: string, pageNumber: number): Promise<{ success: boolean }> {
    if (pageNumber <= 1) {
      throw new BadRequestException('Page is already at the top');
    }

    const pageOrders = [
      { oldPageNumber: pageNumber - 1, newPageNumber: pageNumber },
      { oldPageNumber: pageNumber, newPageNumber: pageNumber - 1 },
    ];

    await this.reorderPages(flipbookId, pageOrders);
    return { success: true };
  }

  /**
   * Move page down (swap with next page)
   */
  async movePageDown(flipbookId: string, pageNumber: number): Promise<{ success: boolean }> {
    // Check if there's a next page
    const nextPage = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber: pageNumber + 1 },
    });

    if (!nextPage) {
      throw new BadRequestException('Page is already at the bottom');
    }

    const pageOrders = [
      { oldPageNumber: pageNumber, newPageNumber: pageNumber + 1 },
      { oldPageNumber: pageNumber + 1, newPageNumber: pageNumber },
    ];

    await this.reorderPages(flipbookId, pageOrders);
    return { success: true };
  }

}



