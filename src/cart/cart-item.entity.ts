import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cart_items')
@Unique(['sessionId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Index()
  @Column({ name: 'product_id', type: 'bigint' })
  productId: string;

  @Column({ type: 'integer', default: 1 })
  qty: number;

  @Column({ name: 'price_snapshot', type: 'numeric', precision: 10, scale: 2 })
  priceSnapshot: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
