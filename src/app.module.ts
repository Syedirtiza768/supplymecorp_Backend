import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product/product.entity';
import { ProductModule } from './product/product.module';
import { CartItem } from './cart/cart-item.entity';
import { CartModule } from './cart/cart.module';
import { WishlistItem } from './wishlist/wishlist-item.entity';
import { WishlistModule } from './wishlist/wishlist.module';
import { ReviewItem } from './review/review-item.entity';
import { ReviewModule } from './review/review.module';
import { FlipbookModule } from './flipbook/flipbook.module';
import { Flipbook } from './flipbook/entities/flipbook.entity';
import { FlipbookPage } from './flipbook/entities/flipbook-page.entity';
import { FlipbookHotspot } from './flipbook/entities/flipbook-hotspot.entity';
import { HotspotsModule } from './hotspots/hotspots.module';
import { Hotspot } from './hotspots/hotspot.entity';
import { CategoryCount } from './product/entities/category-count.entity';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: parseInt(cfg.get<string>('DB_PORT') || '5432', 10),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASS'),
        database: cfg.get<string>('DB_NAME'),
        synchronize: false,
        autoLoadEntities: false,
        entities: [Product, CartItem, WishlistItem, ReviewItem, Flipbook, FlipbookPage, FlipbookHotspot, Hotspot, CategoryCount],
        // Connection pool optimization
        extra: {
          max: 20, // Maximum number of connections in pool
          min: 5, // Minimum number of connections in pool
          idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
          connectionTimeoutMillis: 10000, // Connection timeout 10 seconds
        },
        // Enable query logging in development
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
        // TypeORM query result cache
        cache: {
          duration: 30000, // 30 seconds cache duration
        },
      }),
    }),
  ProductModule,
  CartModule,
  WishlistModule,
  ReviewModule,
  FlipbookModule,
  HotspotsModule,
  CustomersModule,
  ],
})
export class AppModule {}
