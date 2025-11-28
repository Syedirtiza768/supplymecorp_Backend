import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FlipbookPage } from './flipbook-page.entity';

@Entity('flipbook_hotspots')
export class FlipbookHotspot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => FlipbookPage, (page) => page.hotspots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pageId' })
  page: FlipbookPage;

  @Column({ nullable: true })
  productSku: string;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  linkUrl: string;

  @Column('float')
  x: number; // 0-100 percentage

  @Column('float')
  y: number; // 0-100 percentage

  @Column('float')
  width: number; // 0-100 percentage

  @Column('float')
  height: number; // 0-100 percentage

  @Column({ default: 0 })
  zIndex: number;

  @Column('jsonb', { nullable: true })
  meta: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
