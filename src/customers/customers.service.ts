import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);
  private cache: CustomerDto[] | null = null;
  private cacheTimestamp = 0;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private getApiConfig() {
    const apiBase =
      process.env.CP_API_BASE ||
      process.env.COUNTERPOINT_API_URL ||
      'https://utility.rrgeneralsupply.com';
    const apiKey =
      process.env.CUSTOMERS_API_KEY ||
      process.env.COUNTERPOINT_API_KEY ||
      process.env.CP_API_KEY ||
      '';
    const auth =
      process.env.CUSTOMERS_AUTH ||
      process.env.COUNTERPOINT_AUTH_BASIC ||
      (process.env.CP_BASIC_AUTH ? `Basic ${process.env.CP_BASIC_AUTH}` : '');
    const cookie = process.env.COUNTERPOINT_COOKIE || process.env.CP_COOKIE || '';

    return { apiBase, apiKey, auth, cookie };
  }

  private async fetchAllCustomersFromApi(): Promise<CustomerDto[]> {
    const { apiBase, apiKey, auth, cookie } = this.getApiConfig();

    if (!apiKey || !auth) {
      this.logger.error(
        'Missing Counterpoint API credentials. Expected CUSTOMERS_API_KEY/CUSTOMERS_AUTH or COUNTERPOINT_API_KEY/COUNTERPOINT_AUTH_BASIC.',
      );
      return [];
    }

    const url = `${apiBase.replace(/\/$/, '')}/customers`;

    const response = await axios.get(url, {
      headers: {
        APIKey: apiKey,
        Authorization: auth,
        ...(cookie ? { Cookie: cookie } : {}),
        Accept: 'application/json',
      },
      timeout: 15000,
    });

    const data = response?.data;
    const customers = Array.isArray(data?.Customers) ? data.Customers : [];
    this.logger.log(`Fetched ${customers.length} customers from Counterpoint API`);
    return customers;
  }

  private async getCachedCustomers(): Promise<CustomerDto[]> {
    const now = Date.now();
    const cacheValid = this.cache && now - this.cacheTimestamp < this.cacheTtlMs;

    if (cacheValid) {
      return this.cache ?? [];
    }

    try {
      const customers = await this.fetchAllCustomersFromApi();
      this.cache = customers;
      this.cacheTimestamp = now;
      return customers;
    } catch (error) {
      this.logger.error(`Error fetching customers from Counterpoint API: ${error.message}`);
      return this.cache ?? [];
    }
  }

  /**
   * Fetch all customers from the database (Counterpoint customers table)
   * This is called by the frontend during login to validate customer credentials
   */
  async getAllCustomers(): Promise<CustomerDto[]> {
    this.logger.log('Fetching all customers from Counterpoint API');
    return this.getCachedCustomers();
  }

  /**
   * Find a customer by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<CustomerDto | null> {
    const customers = await this.getCachedCustomers();
    const normalized = email?.trim().toLowerCase();
    return (
      customers.find(
        (c) => c.EMAIL_ADRS_1 && c.EMAIL_ADRS_1.trim().toLowerCase() === normalized,
      ) ?? null
    );
  }

  /**
   * Find a customer by customer number
   */
  async findByCustNo(custNo: string): Promise<CustomerDto | null> {
    const customers = await this.getCachedCustomers();
    const normalized = custNo?.trim();
    return customers.find((c) => c.CUST_NO === normalized) ?? null;
  }
}
