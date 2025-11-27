import { Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { FlipbookPagesService } from './flipbook-pages.service';
import { UpdateHotspotsDto } from './dto/update-hotspots.dto';

@Controller('flipbooks')
export class FlipbookPagesController {
  constructor(private readonly pagesService: FlipbookPagesService) {}

  // Delete a single page
  @Delete(':flipbookId/pages/:pageNumber')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePage(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
  ) {
    await this.pagesService.deletePage(flipbookId, pageNumber);
    return;
  }

  // Delete multiple pages (by ?pages=2,3,4)
  @Delete(':flipbookId/pages')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePages(
    @Param('flipbookId') flipbookId: string,
    @Query('pages') pages: string,
  ) {
    const pageNumbers = pages
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
    await this.pagesService.deletePages(flipbookId, pageNumbers);
    return;
  }

  @Get(':flipbookId/pages/:pageNumber/hotspots')
  async getHotspots(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
  ) {
    return await this.pagesService.getPageWithHotspots(flipbookId, pageNumber);
  }

  @Put(':flipbookId/pages/:pageNumber/hotspots')
  async updateHotspots(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() updateDto: UpdateHotspotsDto,
  ) {
    const hotspots = await this.pagesService.updatePageHotspots(
      flipbookId,
      pageNumber,
      updateDto.hotspots,
    );

    const page = await this.pagesService.findOrCreatePage(
      flipbookId,
      pageNumber,
    );

    return {
      page: {
        id: page.id,
        flipbookId: page.flipbookId,
        pageNumber: page.pageNumber,
        imageUrl: page.imageUrl,
      },
      hotspots,
    };
  }
}
