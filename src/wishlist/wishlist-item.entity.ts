import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wishlist_items')
@Unique(['sessionId', 'productId'])
export class WishlistItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'session_id', type: 'varchar', length: 255 })
  sessionId: string;

  @Index()
  @Column({ name: 'product_id', type: 'bigint' })
  productId: string;

  @Column({ name: 'price_snapshot', type: 'numeric', precision: 10, scale: 2, nullable: true })
  priceSnapshot: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
