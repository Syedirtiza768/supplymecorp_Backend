import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { OrgillRepository } from './orgill.repository';
import { CounterPointClient } from './counterpoint.client';

@Module({
  controllers: [ProductController],
  providers: [ProductService, OrgillRepository, CounterPointClient],
  exports: [ProductService],
})
export class ProductModule {}
