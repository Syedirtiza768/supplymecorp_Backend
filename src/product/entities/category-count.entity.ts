import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('category_counts')
export class CategoryCount {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  categoryName: string;

  @Column({ type: 'integer', default: 0 })
  itemCount: number;

  @Column({ type: 'integer', default: 0 })
  totalInOrgill: number; // Total items in orgill_products for this category

  @Column({ type: 'integer', default: 0 })
  availableInCounterpoint: number; // Items available in Counterpoint

  @Column({ type: 'integer', default: 0 })
  withValidImages: number; // Items with valid images

  @Column({ type: 'text', nullable: true })
  calculationNotes: string; // Any notes about the calculation

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isCalculating: boolean; // Flag to prevent concurrent calculations
}
