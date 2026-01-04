import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlipbookPage } from './entities/flipbook-page.entity';
import { FlipbookHotspot } from './entities/flipbook-hotspot.entity';
import { HotspotDto } from './dto/hotspot.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FlipbookPagesService {
  constructor(
    @InjectRepository(FlipbookPage)
    private readonly pageRepository: Repository<FlipbookPage>,
    @InjectRepository(FlipbookHotspot)
    private readonly hotspotRepository: Repository<FlipbookHotspot>,
  ) { }

  /**
   * Find or create a flipbook page by flipbookId and pageNumber
   */
  async findOrCreatePage(
    flipbookId: string,
    pageNumber: number,
    imageUrl?: string,
  ): Promise<FlipbookPage> {
    let page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
      relations: ['hotspots'],
    });

    if (!page) {
      // Use flipbook-specific image path from public folder
      const fallback = this.getStaticPageImage(flipbookId, pageNumber);
      const defaultImageUrl = fallback?.url || imageUrl || `/flipbooks/${flipbookId}/pages/${pageNumber}.jpg`;

      page = this.pageRepository.create({
        flipbookId,
        pageNumber,
        imageUrl: defaultImageUrl,
      });
      await this.pageRepository.save(page);
    } else {
      // Auto-heal: Check if we have a better image in uploads/flipbooks
      const fallback = this.getStaticPageImage(flipbookId, pageNumber);
      if (fallback && fallback.url && page.imageUrl !== fallback.url && !page.imageUrl.includes('blob:')) {
        console.log(`Auto-healing page ${pageNumber} image: ${page.imageUrl} -> ${fallback.url}`);
        page.imageUrl = fallback.url;
        await this.pageRepository.save(page);
      }
    }

    return page;
  }

  /**
   * Get page with all its hotspots
   */
  async getPageWithHotspots(
    flipbookId: string,
    pageNumber: number,
  ): Promise<{ page: FlipbookPage; hotspots: FlipbookHotspot[] }> {
    const page = await this.findOrCreatePage(flipbookId, pageNumber);
    return { page, hotspots: page.hotspots || [] };
  }

  /**
   * Update all hotspots for a page (atomic replacement)
   */
  async updatePageHotspots(
    flipbookId: string,
    pageNumber: number,
    dtos: HotspotDto[],
  ): Promise<FlipbookHotspot[]> {
    const page = await this.findOrCreatePage(flipbookId, pageNumber);

    // Delete all existing hotspots for this page
    await this.hotspotRepository.delete({ page: { id: page.id } });

    // Create new hotspots from DTOs
    const hotspots = dtos.map((dto) => {
      const hotspot = this.hotspotRepository.create({
        ...dto,
        page,
      });
      return hotspot;
    });

    // Save all hotspots
    return await this.hotspotRepository.save(hotspots);
  }
  /**
   * Delete a single page by flipbookId and pageNumber
   */
  async deletePage(flipbookId: string, pageNumber: number): Promise<void> {
    await this.pageRepository.delete({ flipbookId, pageNumber });
  }

  /**
   * Delete multiple pages by flipbookId and array of pageNumbers
   */
  async deletePages(flipbookId: string, pageNumbers: number[]): Promise<void> {
    if (!pageNumbers.length) return;
    await this.pageRepository
      .createQueryBuilder()
      .delete()
      .where("flipbookId = :flipbookId", { flipbookId })
      .andWhere("pageNumber IN (:...pageNumbers)", { pageNumbers })
      .execute();

  }

  private getStaticPageImage(flipbookId: string, pageNumber: number) {
    const extensions = ['webp', 'jpg', 'jpeg', 'png'];

    // 1. Check uploads/flipbooks/[id] (Project-specific uploads)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'flipbooks', flipbookId);
    if (fs.existsSync(uploadsDir)) {
      const paddedPage = String(pageNumber).padStart(3, '0');
      // Patterns to check: catalog_page_001.webp, page-1.jpg, 1.png
      const patterns = [
        `catalog_page_${paddedPage}`, // e.g., catalog_page_001
        `page-${pageNumber}`,         // e.g., page-1
        `${pageNumber}`               // e.g., 1
      ];

      for (const pattern of patterns) {
        for (const ext of extensions) {
          const filename = `${pattern}.${ext}`;
          const filepath = path.join(uploadsDir, filename);
          if (fs.existsSync(filepath)) {
            return {
              filename,
              path: filepath,
              url: `/uploads/flipbooks/${flipbookId}/${filename}`
            };
          }
        }
      }
    }

    // 2. Check public/images/flipbook (Global fallback)
    const staticDir = path.join(
      process.cwd(),
      '..',
      'supplymecorp',
      'public',
      'images',
      'flipbook',
    );
    // Try simpler path if the relative one fails (e.g. if running from dist)
    const staticDirAlt = path.join(process.cwd(), 'public', 'images', 'flipbook');

    const dirsToCheck = [staticDir, staticDirAlt];

    for (const dir of dirsToCheck) {
      if (!fs.existsSync(dir)) continue;

      for (const ext of extensions) {
        const filename = `${pageNumber}.${ext}`;
        const candidate = path.join(dir, filename);
        if (fs.existsSync(candidate)) {
          return { filename, path: candidate, url: null }; // url null means use default behavior or construct manually
        }
      }
    }

    return null;
  }
}
