import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product/product.entity';
import { ProductModule } from './product/product.module';
import { CartItem } from './cart/cart-item.entity';
import { CartModule } from './cart/cart.module';

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
  entities: [Product, CartItem],
      }),
    }),
  ProductModule,
  CartModule,
  ],
})
export class AppModule {}
