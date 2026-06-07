import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Customer, CustomerStatus } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    try {
      await this.checkDuplicateIdentification(createCustomerDto.identification);
      const customer = this.buildCustomer(createCustomerDto);
      return await this.customerRepository.save(customer);
    } catch (error) {
      this.throwCreateError(error, createCustomerDto.identification);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: CustomerStatus,
  ): Promise<{ customers: Customer[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: FindOptionsWhere<Customer> = { deletedAt: null as any };
      if (status) {
        where.status = status;
      }
      const [customers, total] = await this.customerRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: { createDate: 'DESC' },
      });
      return { customers, total, page, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to fetch customers: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id, deletedAt: null as any },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Failed to fetch customer: ${error.message}`);
    }
  }

  async findByIdentification(identification: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { identification, deletedAt: null as any },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with identification ${identification} not found`);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch customer by identification: ${error.message}`,
      );
    }
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    try {
      const customer = await this.findOne(id);
      await this.applyCustomerUpdates(customer, updateCustomerDto);
      return await this.customerRepository.save(customer);
    } catch (error) {
      this.throwUpdateError(error, updateCustomerDto.identification);
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      const customer = await this.findOne(id);
      customer.softDelete();
      await this.customerRepository.save(customer);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Failed to delete customer: ${error.message}`);
    }
  }

  async restore(id: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({ where: { id }, withDeleted: true });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      customer.restore();
      return await this.customerRepository.save(customer);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Failed to restore customer: ${error.message}`);
    }
  }

  private async checkDuplicateIdentification(identification: string): Promise<void> {
    const existing = await this.customerRepository.findOne({
      where: { identification, deletedAt: null as any },
    });
    if (existing) {
      throw new BadRequestException(
        `Customer with identification ${identification} already exists`,
      );
    }
  }

  private buildCustomer(dto: CreateCustomerDto): Customer {
    const customer = new Customer();
    customer.identification = dto.identification;
    customer.name = dto.name;
    customer.lastname = dto.lastname;
    customer.dateBorn = new Date(dto.dateBorn);
    customer.gender = dto.gender;
    customer.status = dto.status || CustomerStatus.PENDING;
    customer.validateIdentification();
    customer.validateName();
    customer.validateLastname();
    return customer;
  }

  private throwCreateError(error: any, identification: string): never {
    if (error instanceof BadRequestException) throw error;
    if (error.code === '23505') {
      throw new BadRequestException(
        `Customer with identification ${identification} already exists`,
      );
    }
    throw new InternalServerErrorException(`Failed to create customer: ${error.message}`);
  }

  private async applyCustomerUpdates(customer: Customer, dto: UpdateCustomerDto): Promise<void> {
    if (dto.identification && dto.identification !== customer.identification) {
      await this.checkDuplicateIdentification(dto.identification);
      customer.identification = dto.identification;
      customer.validateIdentification();
    }
    if (dto.name) {
      customer.name = dto.name;
      customer.validateName();
    }
    if (dto.lastname) {
      customer.lastname = dto.lastname;
      customer.validateLastname();
    }
    if (dto.dateBorn) customer.dateBorn = new Date(dto.dateBorn);
    if (dto.gender) customer.gender = dto.gender;
    if (dto.status) customer.status = dto.status;
  }

  private throwUpdateError(error: any, identification?: string): never {
    if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
    if (error.code === '23505') {
      throw new BadRequestException(
        `Customer with identification ${identification} already exists`,
      );
    }
    throw new InternalServerErrorException(`Failed to update customer: ${error.message}`);
  }
}
