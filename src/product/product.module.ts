import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { OrgillRepository } from './orgill.repository';
import { CounterPointClient } from './counterpoint.client';
import { CategoryCount } from './entities/category-count.entity';
import { CategoryCountService } from './category-count.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({
      timeout: 10000,      // 10 seconds timeout
      maxRedirects: 3,
    }),
    TypeOrmModule.forFeature([Product, CategoryCount]),
  ],
  controllers: [ProductController],
  providers: [ProductService, OrgillRepository, CounterPointClient, CategoryCountService],
  exports: [ProductService, CategoryCountService],
})
export class ProductModule {}
