import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flipbook } from './entities/flipbook.entity';
import { FlipbookPage } from './entities/flipbook-page.entity';
import { FlipbookHotspot } from './entities/flipbook-hotspot.entity';
import { FlipbookPagesController } from './flipbook-pages.controller';
import { FlipbooksController } from './flipbooks.controller';
import { FlipbookPagesService } from './flipbook-pages.service';
import { FlipbooksService } from './flipbooks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Flipbook, FlipbookPage, FlipbookHotspot])],
  controllers: [FlipbooksController, FlipbookPagesController],
  providers: [FlipbooksService, FlipbookPagesService],
  exports: [FlipbooksService, FlipbookPagesService],
})
export class FlipbookModule {}
