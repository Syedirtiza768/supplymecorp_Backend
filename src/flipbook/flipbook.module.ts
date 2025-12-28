import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Flipbook } from './entities/flipbook.entity';
import { FlipbookPage } from './entities/flipbook-page.entity';
import { FlipbookHotspot } from './entities/flipbook-hotspot.entity';
import { FlipbookPagesController } from './flipbook-pages.controller';
import { FlipbooksController } from './flipbooks.controller';
import { FlipbookPagesService } from './flipbook-pages.service';
import { FlipbooksService } from './flipbooks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flipbook, FlipbookPage, FlipbookHotspot]),
    CacheModule.register({
      ttl: 3600000, // 1 hour in milliseconds (increased from 5 min for better performance)
      max: 500, // maximum number of items in cache (increased from 100)
    }),
  ],
  controllers: [FlipbooksController, FlipbookPagesController],
  providers: [FlipbooksService, FlipbookPagesService],
  exports: [FlipbooksService, FlipbookPagesService],
})
export class FlipbookModule {}
