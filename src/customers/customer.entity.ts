import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Customer entity mapping to Counterpoint customer data
 * This represents customer data from Counterpoint system
 */
@Entity('customers')
export class Customer {
  @PrimaryColumn({ name: 'CUST_NO', type: 'text' })
  custNo: string;

  @Column({ name: 'NAM', type: 'text', nullable: true })
  name: string;

  @Column({ name: 'EMAIL_ADRS_1', type: 'text', nullable: true })
  emailAdrs1: string;

  @Column({ name: 'FST_NAM', type: 'text', nullable: true })
  firstName: string;

  @Column({ name: 'LST_NAM', type: 'text', nullable: true })
  lastName: string;

  @Column({ name: 'PHONE_1', type: 'text', nullable: true })
  phone1: string;

  @Column({ name: 'ADDR_1', type: 'text', nullable: true })
  addr1: string;

  @Column({ name: 'CITY', type: 'text', nullable: true })
  city: string;

  @Column({ name: 'STATE', type: 'text', nullable: true })
  state: string;

  @Column({ name: 'ZIP_COD', type: 'text', nullable: true })
  zipCode: string;

  @Column({ name: 'CNTRY', type: 'text', nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  EMAIL_ADRS_1: string;

  @Column({ type: 'text', nullable: true })
  NAM: string;

  @Column({ type: 'text', nullable: true })
  CUST_NO: string;

  @Column({ type: 'text', nullable: true })
  FST_NAM: string;

  @Column({ type: 'text', nullable: true })
  LST_NAM: string;

  @Column({ type: 'text', nullable: true })
  PHONE_1: string;

  @Column({ type: 'text', nullable: true })
  ADDR_1: string;

  @Column({ type: 'text', nullable: true })
  CITY: string;

  @Column({ type: 'text', nullable: true })
  STATE: string;

  @Column({ type: 'text', nullable: true })
  ZIP_COD: string;
}
