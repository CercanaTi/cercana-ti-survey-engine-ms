import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiQuery, ApiParam } from '@nestjs/swagger';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { Customer, CustomerStatus } from '../entities/customer.entity';
import { ApiCrudController } from '../../../common/decorators/base-crud.decorator';
import {
  ApiCrudOperation,
  ApiFindByIdentification,
} from '../../../common/decorators/api-crud.decorator';

@ApiCrudController('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiCrudOperation('create', 'Customer', Customer)
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @ApiCrudOperation('findAll', 'Customer', Customer)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starting from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CustomerStatus,
    description: 'Filter by customer status',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: CustomerStatus,
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.customerService.findAll(pageNumber, limitNumber, status);
  }

  @Get(':id')
  @ApiCrudOperation('findOne', 'Customer', Customer)
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customerService.findOne(id);
  }

  @Get('identification/:identification')
  @ApiFindByIdentification('Customer', Customer)
  async findByIdentification(@Param('identification') identification: string): Promise<Customer> {
    return this.customerService.findByIdentification(identification);
  }

  @Put(':id')
  @ApiCrudOperation('update', 'Customer', Customer)
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiCrudOperation('delete', 'Customer')
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.customerService.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiCrudOperation('restore', 'Customer', Customer)
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  async restore(@Param('id') id: string): Promise<Customer> {
    return this.customerService.restore(id);
  }
}
