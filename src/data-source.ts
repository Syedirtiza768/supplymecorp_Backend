import { DataSource } from 'typeorm';
import { CartItem } from './cart/cart-item.entity';
import { WishlistItem } from './wishlist/wishlist-item.entity';
import { ReviewItem } from './review/review-item.entity';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'global321',
  database: process.env.DB_DATABASE || 'orgill',
  entities: [CartItem, WishlistItem, ReviewItem],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
