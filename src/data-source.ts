import { DataSource } from 'typeorm';
import { CartItem } from './cart/cart-item.entity';
import { WishlistItem } from './wishlist/wishlist-item.entity';
import { ReviewItem } from './review/review-item.entity';
import { Hotspot } from './hotspots/hotspot.entity';
import { Product } from './product/product.entity';
import { Flipbook } from './flipbook/entities/flipbook.entity';
import { FlipbookPage } from './flipbook/entities/flipbook-page.entity';
import { FlipbookHotspot } from './flipbook/entities/flipbook-hotspot.entity';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'global321',
  database: process.env.DB_DATABASE || 'orgill',
  entities: [CartItem, WishlistItem, ReviewItem, Hotspot, Product, Flipbook, FlipbookPage, FlipbookHotspot],
  migrations: [__dirname + '/migration/*{.ts,.js}'],
  synchronize: false,
});
