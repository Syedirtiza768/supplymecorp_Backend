import { Controller, Get, Logger, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerDto } from './dto/customer.dto';

@Controller('customers')
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly customersService: CustomersService) {}

  /**
   * GET /api/customers?email=xxx
   * If email is provided, returns single customer by email (fast)
   * If no email, returns all customers (slow - avoid if possible)
   */
  @Get()
  async getCustomers(@Query('email') email?: string): Promise<CustomerDto | CustomerDto[]> {
    if (email) {
      this.logger.log(`GET /api/customers?email=${email} - Fetching customer by email`);
      const customer = await this.customersService.findByEmail(email);
      
      if (!customer) {
        this.logger.warn(`Customer not found for email: ${email}`);
        return [];
      }
      
      this.logger.log(`Found customer: ${customer.NAM} (${customer.CUST_NO})`);
      return [customer]; // Return as array for frontend compatibility
    } else {
      this.logger.warn('GET /api/customers - Fetching ALL customers (slow, consider adding email param)');
      const customers = await this.customersService.getAllCustomers();
      this.logger.log(`Returning ${customers.length} customers`);
      return customers;
    }
  }
}
