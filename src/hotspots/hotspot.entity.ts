import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("hotspots")
export class Hotspot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  flipbookId: string; // "2025-Catalog-Spring-Summer"

  @Column()
  pageNumber: number;

  @Column("float")
  x: number;

  @Column("float")
  y: number;

  @Column("float")
  width: number;

  @Column("float")
  height: number;

  @Column({ nullable: true })
  productId: string;

  // Note: Product relationship maintained at application level
  // Foreign key not enforced at database level due to schema constraints

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
