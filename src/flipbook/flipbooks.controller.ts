import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Query,
  Put,
  ParseIntPipe,
  Patch,
  Res,
  StreamableFile,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FlipbooksService } from './flipbooks.service';
import { CreateFlipbookDto } from './dto/create-flipbook.dto';
import { UpdateFlipbookDto } from './dto/update-flipbook.dto';
import { UpdateHotspotsDto } from './dto/update-hotspots.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { DeletePagesDto, BulkDeleteHotspotsDto, BulkUpdateHotspotsDto } from './dto/bulk-operations.dto';
import { HotspotDto } from './dto/hotspot.dto';

@Controller('flipbooks')
export class FlipbooksController {
  constructor(
    private readonly flipbooksService: FlipbooksService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post()
  createFlipbook(@Body() dto: CreateFlipbookDto) {
    return this.flipbooksService.createOrFindFlipbook(dto);
  }

  @Get()
  findAllFlipbooks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.flipbooksService.findAllFlipbooks(pageNum, limitNum);
  }

  @Get(':id')
  findFlipbookById(@Param('id') id: string) {
    return this.flipbooksService.findFlipbookById(id, true);
  }

  @Put(':id')
  updateFlipbook(@Param('id') id: string, @Body() dto: UpdateFlipbookDto) {
    return this.flipbooksService.updateFlipbook(id, dto);
  }

  @Patch(':id/toggle-featured')
  async toggleFeatured(@Param('id') id: string) {
    const result = await this.flipbooksService.toggleFeatured(id);
    // Clear featured flipbook cache when toggling
    await this.cacheManager.del('featured-flipbook');
    return result;
  }

  @Post('cache/clear')
  async clearCache() {
    // Cache manager in v5 doesn't have a direct reset method
    // Clear known cache keys instead
    const keysToDelete = [
      'featured-flipbook',
      'all-flipbooks',
    ];
    
    for (const key of keysToDelete) {
      await this.cacheManager.del(key);
    }
    
    return { message: 'All flipbook caches cleared successfully', clearedKeys: keysToDelete };
  }

  @Delete('cache/featured')
  async clearFeaturedCache() {
    await this.cacheManager.del('featured-flipbook');
    return { message: 'Featured flipbook cache cleared successfully' };
  }

  @Get('featured/current')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @CacheKey('featured-flipbook')
  getFeaturedFlipbook() {
    return this.flipbooksService.getFeaturedFlipbook();
  }

  @Get(':flipbookId/pages')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  findPagesByFlipbookId(
    @Param('flipbookId') flipbookId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.flipbooksService.findPagesByFlipbookId(flipbookId, pageNum, limitNum);
  }

  @Post(':flipbookId/pages/upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadPage(
    @Param('flipbookId') flipbookId: string,
    @UploadedFile() file: any,
    @Query('pageNumber') pageNumber?: string,
  ) {
    const pageNum = pageNumber ? parseInt(pageNumber, 10) : undefined;
    return await this.flipbooksService.uploadPage(flipbookId, file, pageNum);
  }

  @Get(':flipbookId/pages/:pageNumber/hotspots')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  async getPageWithHotspots(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Res() res: Response,
  ) {
    // Set aggressive cache headers for immutable flipbook hotspots
    res.set('Cache-Control', 'public, max-age=3600, immutable');
    res.set('ETag', `hotspots-${flipbookId}-${pageNumber}`);
    // Must explicitly send response when using @Res() decorator
    const data = await this.flipbooksService.getPageWithHotspots(flipbookId, pageNumber);
    return res.json(data);
  }

  @Get(':flipbookId/hotspots/all')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  async getAllHotspots(
    @Param('flipbookId') flipbookId: string,
    @Res() res: Response,
  ) {
    // Set aggressive cache headers for instant loading
    res.set('Cache-Control', 'public, max-age=3600, immutable');
    res.set('ETag', `all-hotspots-${flipbookId}`);
    const data = await this.flipbooksService.getAllHotspotsForFlipbook(flipbookId);
    return res.json(data);
  }

  @Put(':flipbookId/pages/:pageNumber/hotspots')
  updatePageHotspots(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() dto: UpdateHotspotsDto,
  ) {
    return this.flipbooksService.updatePageHotspots(
      flipbookId,
      pageNumber,
      dto.hotspots,
    );
  }

  @Delete(':flipbookId/pages/:pageNumber')
  deletePage(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
  ) {
    return this.flipbooksService.deletePage(flipbookId, pageNumber);
  }

  @Patch(':flipbookId/pages/:pageNumber')
  updatePage(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() dto: UpdatePageDto,
  ) {
    return this.flipbooksService.updatePage(flipbookId, pageNumber, dto);
  }

  @Post(':flipbookId/pages/delete-batch')
  deletePagesBatch(
    @Param('flipbookId') flipbookId: string,
    @Body() dto: DeletePagesDto,
  ) {
    return this.flipbooksService.deletePages(flipbookId, dto.pageNumbers);
  }

  @Post(':flipbookId/pages/:pageNumber/duplicate')
  duplicatePage(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Query('newPageNumber') newPageNumber?: string,
  ) {
    const newNum = newPageNumber ? parseInt(newPageNumber, 10) : undefined;
    return this.flipbooksService.duplicatePage(flipbookId, pageNumber, newNum);
  }

  @Post(':flipbookId/pages/reorder')
  reorderPages(
    @Param('flipbookId') flipbookId: string,
    @Body() body: { pageOrders: Array<{ oldPageNumber: number; newPageNumber: number }> },
  ) {
    return this.flipbooksService.reorderPages(flipbookId, body.pageOrders);
  }

  @Delete(':id')
  deleteFlipbook(@Param('id') id: string) {
    return this.flipbooksService.deleteFlipbook(id);
  }

  @Post(':id/clone')
  cloneFlipbook(
    @Param('id') id: string,
    @Body() body: { title: string; description?: string },
  ) {
    return this.flipbooksService.cloneFlipbook(id, body.title, body.description);
  }

  @Get(':flipbookId/export/json')
  exportFlipbookJSON(@Param('flipbookId') flipbookId: string) {
    return this.flipbooksService.exportFlipbookJSON(flipbookId);
  }

  @Post('import/json')
  importFlipbookJSON(@Body() data: any) {
    return this.flipbooksService.importFlipbookJSON(data);
  }

  @Get(':flipbookId/export/pdf')
  async exportToPDF(
    @Param('flipbookId') flipbookId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.flipbooksService.generatePDF(flipbookId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${flipbookId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  // Individual Hotspot CRUD Operations

  @Post(':flipbookId/pages/:pageNumber/hotspots/single')
  createSingleHotspot(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() dto: HotspotDto,
  ) {
    return this.flipbooksService.createSingleHotspot(flipbookId, pageNumber, dto);
  }

  @Patch(':flipbookId/pages/:pageNumber/hotspots/:hotspotId')
  updateSingleHotspot(
    @Param('hotspotId') hotspotId: string,
    @Body() dto: Partial<HotspotDto>,
  ) {
    return this.flipbooksService.updateSingleHotspot(hotspotId, dto);
  }

  @Delete(':flipbookId/pages/:pageNumber/hotspots/:hotspotId')
  deleteSingleHotspot(@Param('hotspotId') hotspotId: string) {
    return this.flipbooksService.deleteSingleHotspot(hotspotId);
  }

  // Bulk Hotspot Operations

  @Post(':flipbookId/pages/:pageNumber/hotspots/bulk-delete')
  bulkDeleteHotspots(@Body() dto: BulkDeleteHotspotsDto) {
    return this.flipbooksService.bulkDeleteHotspots(dto.hotspotIds);
  }

  @Patch(':flipbookId/pages/:pageNumber/hotspots/bulk-update')
  bulkUpdateHotspots(@Body() dto: BulkUpdateHotspotsDto) {
    return this.flipbooksService.bulkUpdateHotspots(dto.hotspotIds, dto.updates);
  }

  @Post(':flipbookId/pages/:pageNumber/hotspots/paste')
  pasteHotspots(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() body: { hotspots: HotspotDto[] },
  ) {
    return this.flipbooksService.pasteHotspots(flipbookId, pageNumber, body.hotspots);
  }

  // Page Movement Operations

  @Post(':flipbookId/pages/:pageNumber/move-up')
  movePageUp(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
  ) {
    return this.flipbooksService.movePageUp(flipbookId, pageNumber);
  }

  @Post(':flipbookId/pages/:pageNumber/move-down')
  movePageDown(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
  ) {
    return this.flipbooksService.movePageDown(flipbookId, pageNumber);
  }
}
