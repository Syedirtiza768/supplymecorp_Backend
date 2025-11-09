import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('orgill_products') // Using the correct table name
export class Product {
  // Using sku as the primary key
  @PrimaryColumn({ name: 'sku', type: 'text', nullable: false })
  id: string; // This maps to the sku column

  @Column({ name: 'category-code', type: 'double precision', nullable: true })
  categoryCode: number;

  @Column({ name: 'upc-code', type: 'text', nullable: true })
  upcCode: string;

  @Column({ name: 'model-number', type: 'text', nullable: true })
  modelNumber: string;

  @Column({ name: 'brand-name', type: 'text', nullable: true })
  brandName: string;

  @Column({ name: 'category-title-description', type: 'text', nullable: true })
  categoryTitleDescription: string;

  @Column({ name: 'online-title-description', type: 'text', nullable: true })
  onlineTitleDescription: string;
  
  @Column({ name: 'online-long-description', type: 'text', nullable: true })
  onlineLongDescription: string;

  // Feature bullets
  @Column({ name: 'online-feature-bullet-1', type: 'text', nullable: true })
  onlineFeatureBullet1: string;

  @Column({ name: 'online-feature-bullet-2', type: 'text', nullable: true })
  onlineFeatureBullet2: string;

  @Column({ name: 'online-feature-bullet-3', type: 'text', nullable: true })
  onlineFeatureBullet3: string;

  @Column({ name: 'online-feature-bullet-4', type: 'text', nullable: true })
  onlineFeatureBullet4: string;

  @Column({ name: 'online-feature-bullet-5', type: 'text', nullable: true })
  onlineFeatureBullet5: string;

  // More feature bullets...
  @Column({ name: 'online-feature-bullet-6', type: 'text', nullable: true })
  onlineFeatureBullet6: string;

  @Column({ name: 'online-feature-bullet-7', type: 'text', nullable: true })
  onlineFeatureBullet7: string;

  @Column({ name: 'online-feature-bullet-8', type: 'text', nullable: true })
  onlineFeatureBullet8: string;

  @Column({ name: 'online-feature-bullet-9', type: 'text', nullable: true })
  onlineFeatureBullet9: string;

  @Column({ name: 'online-feature-bullet-10', type: 'text', nullable: true })
  onlineFeatureBullet10: string;

  // Product images
  @Column({ name: 'item-image-item-image1', type: 'text', nullable: true })
  itemImage1: string;

  @Column({ name: 'item-image-item-image2', type: 'text', nullable: true })
  itemImage2: string;

  @Column({ name: 'item-image-item-image3', type: 'text', nullable: true })
  itemImage3: string;

  @Column({ name: 'item-image-item-image4', type: 'text', nullable: true })
  itemImage4: string;

  // Product documents
  @Column({ name: 'item-document-name-1', type: 'text', nullable: true })
  itemDocumentName1: string;

  @Column({ name: 'item-document-name-2', type: 'text', nullable: true })
  itemDocumentName2: string;

  @Column({ name: 'item-document-name-3', type: 'text', nullable: true })
  itemDocumentName3: string;

  // Application and warranty
  @Column({ type: 'text', nullable: true })
  application: string;

  @Column({ type: 'text', nullable: true })
  warranty: string;

  // New fields for Most Viewed, New, Featured functionality
  @Column({ name: 'view_count', type: 'integer', nullable: false, default: 0 })
  viewCount: number;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'featured', type: 'boolean', nullable: false, default: false })
  featured: boolean;

  // Allow dynamic property access for attribute fields
  [key: string]: any;
}