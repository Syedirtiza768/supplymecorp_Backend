import { Controller, Get, Logger } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerDto } from './dto/customer.dto';

@Controller('customers')
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly customersService: CustomersService) {}

  /**
   * GET /api/customers
   * Returns all customers for frontend login validation
   * The frontend searches this list to validate customer credentials
   */
  @Get()
  async getAllCustomers(): Promise<CustomerDto[]> {
    this.logger.log('GET /api/customers - Fetching all customers');
    const customers = await this.customersService.getAllCustomers();
    this.logger.log(`Returning ${customers.length} customers`);
    return customers;
  }
}
