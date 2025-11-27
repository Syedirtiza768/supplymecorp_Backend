import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlipbookPage } from './entities/flipbook-page.entity';
import { FlipbookHotspot } from './entities/flipbook-hotspot.entity';
import { HotspotDto } from './dto/hotspot.dto';

@Injectable()
export class FlipbookPagesService {
  constructor(
    @InjectRepository(FlipbookPage)
    private readonly pageRepository: Repository<FlipbookPage>,
    @InjectRepository(FlipbookHotspot)
    private readonly hotspotRepository: Repository<FlipbookHotspot>,
  ) {}

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
      const defaultImageUrl = imageUrl || `/flipbooks/${flipbookId}/pages/${pageNumber}.jpg`;
      page = this.pageRepository.create({
        flipbookId,
        pageNumber,
        imageUrl: defaultImageUrl,
      });
      await this.pageRepository.save(page);
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
    await this.pageRepository.delete(pageNumbers.map((pageNumber) => ({ flipbookId, pageNumber })));
  }
}
