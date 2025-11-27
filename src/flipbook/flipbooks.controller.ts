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
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FlipbooksService } from './flipbooks.service';
import { CreateFlipbookDto } from './dto/create-flipbook.dto';
import { UpdateFlipbookDto } from './dto/update-flipbook.dto';
import { UpdateHotspotsDto } from './dto/update-hotspots.dto';

@Controller('flipbooks')
export class FlipbooksController {
  constructor(private readonly flipbooksService: FlipbooksService) {}

  @Post()
  createFlipbook(@Body() dto: CreateFlipbookDto) {
    return this.flipbooksService.createOrFindFlipbook(dto);
  }

  @Get()
  findAllFlipbooks() {
    return this.flipbooksService.findAllFlipbooks();
  }

  @Get(':id')
  findFlipbookById(@Param('id') id: string) {
    return this.flipbooksService.findFlipbookById(id);
  }

  @Put(':id')
  updateFlipbook(@Param('id') id: string, @Body() dto: UpdateFlipbookDto) {
    return this.flipbooksService.updateFlipbook(id, dto);
  }

  @Patch(':id/toggle-featured')
  toggleFeatured(@Param('id') id: string) {
    return this.flipbooksService.toggleFeatured(id);
  }

  @Get('featured/current')
  getFeaturedFlipbook() {
    return this.flipbooksService.getFeaturedFlipbook();
  }

  @Get(':flipbookId/pages')
  findPagesByFlipbookId(@Param('flipbookId') flipbookId: string) {
    return this.flipbooksService.findPagesByFlipbookId(flipbookId);
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
  getPageWithHotspots(
    @Param('flipbookId') flipbookId: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
  ) {
    return this.flipbooksService.getPageWithHotspots(flipbookId, pageNumber);
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

  @Delete(':id')
  deleteFlipbook(@Param('id') id: string) {
    return this.flipbooksService.deleteFlipbook(id);
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
}
