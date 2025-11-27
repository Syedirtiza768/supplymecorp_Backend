import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FlipbookHotspot } from './flipbook-hotspot.entity';
import { Flipbook } from './flipbook.entity';

@Entity('flipbook_pages')
@Index(['flipbookId', 'pageNumber'], { unique: true })
export class FlipbookPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flipbookId: string;

  @Column()
  pageNumber: number;

  @Column()
  imageUrl: string;

  @ManyToOne(() => Flipbook, (flipbook) => flipbook.pages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flipbookId' })
  flipbook: Flipbook;

  @OneToMany(() => FlipbookHotspot, (hotspot) => hotspot.page, {
    cascade: true,
    eager: true,
  })
  hotspots: FlipbookHotspot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
