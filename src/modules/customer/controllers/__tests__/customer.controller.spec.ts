import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from '../customer.controller';
import { CustomerService } from '../../services/customer.service';
import { Customer, CustomerStatus, CustomerGender } from '../../entities/customer.entity';
import { CreateCustomerDto } from '../../dto/create-customer.dto';
import { UpdateCustomerDto } from '../../dto/update-customer.dto';

describe('CustomerController', () => {
  let controller: CustomerController;
  let mockCustomerService: Record<string, jest.Mock>;

  const mockCustomer = {
    id: 'uuid-1',
    identification: '123456789',
    name: 'John',
    lastname: 'Doe',
    dateBorn: new Date('1990-01-01'),
    gender: CustomerGender.MALE,
    status: CustomerStatus.PENDING,
  } as Customer;

  const mockPaginatedResult = {
    customers: [mockCustomer],
    total: 1,
    page: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    mockCustomerService = {
      create: jest.fn().mockResolvedValue(mockCustomer),
      findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
      findOne: jest.fn().mockResolvedValue(mockCustomer),
      findByIdentification: jest.fn().mockResolvedValue(mockCustomer),
      update: jest.fn().mockResolvedValue(mockCustomer),
      softDelete: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn().mockResolvedValue(mockCustomer),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [{ provide: CustomerService, useValue: mockCustomerService }],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
  });

  describe('create', () => {
    it('should create a customer and return it', async () => {
      const dto: CreateCustomerDto = {
        identification: '123456789',
        name: 'John',
        lastname: 'Doe',
        dateBorn: '1990-01-01',
        gender: CustomerGender.MALE,
      };

      const result = await controller.create(dto);

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers with default params', async () => {
      const result = await controller.findAll('1', '10', undefined);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockCustomerService.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('should filter by status when provided', async () => {
      await controller.findAll('1', '10', CustomerStatus.ACTIVE);

      expect(mockCustomerService.findAll).toHaveBeenCalledWith(1, 10, CustomerStatus.ACTIVE);
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const result = await controller.findOne('uuid-1');

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerService.findOne).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('findByIdentification', () => {
    it('should return a customer by identification', async () => {
      const result = await controller.findByIdentification('123456789');

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerService.findByIdentification).toHaveBeenCalledWith('123456789');
    });
  });

  describe('update', () => {
    it('should update a customer and return the updated entity', async () => {
      const dto: UpdateCustomerDto = { name: 'Jane' };

      const result = await controller.update('uuid-1', dto);

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerService.update).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('remove', () => {
    it('should soft-delete a customer', async () => {
      await controller.remove('uuid-1');

      expect(mockCustomerService.softDelete).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted customer', async () => {
      const result = await controller.restore('uuid-1');

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerService.restore).toHaveBeenCalledWith('uuid-1');
    });
  });
});
