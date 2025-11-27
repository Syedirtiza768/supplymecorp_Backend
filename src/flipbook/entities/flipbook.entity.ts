import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { FlipbookPage } from './flipbook-page.entity';

@Entity('flipbooks')
export class Flipbook {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string; // This will now be your slug, e.g., "2025-Catalog-Spring-Summer"

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index()
  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FlipbookPage, (page) => page.flipbook)
  pages: FlipbookPage[];
}
