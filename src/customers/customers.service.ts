import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly ds: DataSource) {}

  /**
   * Fetch all customers from the database (Counterpoint customers table)
   * This is called by the frontend during login to validate customer credentials
   */
  async getAllCustomers(): Promise<CustomerDto[]> {
    try {
      this.logger.log('Fetching all customers from database');

      const customers = await this.ds.query(
        `
        SELECT 
          CUST_NO,
          NAM,
          EMAIL_ADRS_1,
          FST_NAM,
          LST_NAM,
          PHONE_1,
          ADDR_1,
          CITY,
          STATE,
          ZIP_COD
        FROM public.customers
        ORDER BY NAM ASC
        `,
      );

      this.logger.log(`Retrieved ${customers.length} customers`);
      return customers;
    } catch (error) {
      this.logger.error(`Error fetching customers: ${error.message}`);
      // Return empty array if table doesn't exist or query fails
      return [];
    }
  }

  /**
   * Find a customer by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<CustomerDto | null> {
    try {
      const customers = await this.ds.query(
        `
        SELECT 
          CUST_NO,
          NAM,
          EMAIL_ADRS_1,
          FST_NAM,
          LST_NAM,
          PHONE_1,
          ADDR_1,
          CITY,
          STATE,
          ZIP_COD
        FROM public.customers
        WHERE LOWER(EMAIL_ADRS_1) = LOWER($1)
        LIMIT 1
        `,
        [email],
      );

      return customers?.[0] ?? null;
    } catch (error) {
      this.logger.error(`Error finding customer by email: ${error.message}`);
      return null;
    }
  }

  /**
   * Find a customer by customer number
   */
  async findByCustNo(custNo: string): Promise<CustomerDto | null> {
    try {
      const customers = await this.ds.query(
        `
        SELECT 
          CUST_NO,
          NAM,
          EMAIL_ADRS_1,
          FST_NAM,
          LST_NAM,
          PHONE_1,
          ADDR_1,
          CITY,
          STATE,
          ZIP_COD
        FROM public.customers
        WHERE CUST_NO = $1
        LIMIT 1
        `,
        [custNo],
      );

      return customers?.[0] ?? null;
    } catch (error) {
      this.logger.error(`Error finding customer by CUST_NO: ${error.message}`);
      return null;
    }
  }
}
