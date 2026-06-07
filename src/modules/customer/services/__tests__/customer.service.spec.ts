import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from '../customer.service';
import { Customer, CustomerGender, CustomerStatus } from '../../entities/customer.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockRepository = {
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createCustomerDto = {
        identification: '12345678901',
        name: 'John',
        lastname: 'Doe',
        dateBorn: '1990-01-15',
        gender: CustomerGender.MALE,
        status: CustomerStatus.ACTIVE,
      };

      const expectedCustomer = new Customer();
      Object.assign(expectedCustomer, {
        ...createCustomerDto,
        id: 'uuid-123',
        dateBorn: new Date('1990-01-15'),
        createDate: new Date(),
        updateDate: new Date(),
      });

      mockRepository.save.mockResolvedValue(expectedCustomer);

      const result = await service.create(createCustomerDto);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error for invalid identification', async () => {
      const createCustomerDto = {
        identification: '', // Invalid
        name: 'John',
        lastname: 'Doe',
        dateBorn: '1990-01-15',
        gender: CustomerGender.MALE,
      };

      await expect(service.create(createCustomerDto)).rejects.toThrow('Identification is required');
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        { id: '1', name: 'John', lastname: 'Doe' },
        { id: '2', name: 'Jane', lastname: 'Smith' },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockCustomers, 2]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        customers: mockCustomers,
        total: 2,
        page: 1,
        totalPages: 1,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
        order: { createDate: 'DESC' },
      });
    });

    it('should return filtered customers by status', async () => {
      const mockCustomers = [
        { id: '1', name: 'John', lastname: 'Doe', status: CustomerStatus.ACTIVE },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockCustomers, 1]);

      const result = await service.findAll(1, 10, CustomerStatus.ACTIVE);

      expect(result).toEqual({
        customers: mockCustomers,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: null, status: CustomerStatus.ACTIVE },
        skip: 0,
        take: 10,
        order: { createDate: 'DESC' },
      });
    });

    it('should handle pagination correctly for page 2', async () => {
      const mockCustomers = [{ id: '3', name: 'Bob', lastname: 'Wilson' }];

      mockRepository.findAndCount.mockResolvedValue([mockCustomers, 21]);

      const result = await service.findAll(2, 10);

      expect(result).toEqual({
        customers: mockCustomers,
        total: 21,
        page: 2,
        totalPages: 3,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 10,
        take: 10,
        order: { createDate: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = { id: '1', name: 'John', lastname: 'Doe' };
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: null },
      });
    });

    it('should throw error if customer not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow('Customer with ID 1 not found');
    });
  });

  describe('findByIdentification', () => {
    it('should return a customer by identification', async () => {
      const mockCustomer = {
        id: '1',
        identification: '12345678901',
        name: 'John',
        lastname: 'Doe',
      };
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByIdentification('12345678901');

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { identification: '12345678901', deletedAt: null },
      });
    });

    it('should throw error if customer not found by identification', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByIdentification('nonexistent')).rejects.toThrow(
        'Customer with identification nonexistent not found',
      );
    });
  });

  describe('update', () => {
    it('should update customer with partial data', async () => {
      const existingCustomer = new Customer();
      existingCustomer.id = '1';
      existingCustomer.identification = '12345678901';
      existingCustomer.name = 'John';
      existingCustomer.lastname = 'Doe';
      existingCustomer.gender = CustomerGender.MALE;
      existingCustomer.status = CustomerStatus.ACTIVE;

      const updateDto = {
        name: 'Johnny',
        status: CustomerStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(existingCustomer);
      mockRepository.save.mockResolvedValue({ ...existingCustomer, ...updateDto });

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('Johnny');
      expect(result.status).toBe(CustomerStatus.PENDING);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update customer identification and validate it', async () => {
      const existingCustomer = new Customer();
      existingCustomer.id = '1';
      existingCustomer.identification = '12345678901';
      existingCustomer.name = 'John';
      existingCustomer.lastname = 'Doe';

      const updateDto = {
        identification: '09876543210',
      };

      // Mock findOne to return different values based on the query
      mockRepository.findOne.mockImplementation((options) => {
        // First call: find customer by ID
        if (options.where.id) {
          return Promise.resolve(existingCustomer);
        }
        // Second call: check for duplicate identification (should return null)
        if (options.where.identification) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      mockRepository.save.mockResolvedValue({ ...existingCustomer, ...updateDto });

      const result = await service.update('1', updateDto);

      expect(result.identification).toBe('09876543210');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update customer dateBorn', async () => {
      const existingCustomer = new Customer();
      existingCustomer.id = '1';
      existingCustomer.identification = '12345678901';
      existingCustomer.name = 'John';
      existingCustomer.lastname = 'Doe';
      existingCustomer.dateBorn = new Date('1990-01-15');

      const updateDto = {
        dateBorn: '1985-06-20',
      };

      mockRepository.findOne.mockResolvedValue(existingCustomer);
      mockRepository.save.mockResolvedValue(existingCustomer);

      await service.update('1', updateDto);

      expect(existingCustomer.dateBorn).toEqual(new Date('1985-06-20'));
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update customer gender', async () => {
      const existingCustomer = new Customer();
      existingCustomer.id = '1';
      existingCustomer.identification = '12345678901';
      existingCustomer.name = 'John';
      existingCustomer.lastname = 'Doe';
      existingCustomer.gender = CustomerGender.MALE;

      const updateDto = {
        gender: CustomerGender.FEMALE,
      };

      mockRepository.findOne.mockResolvedValue(existingCustomer);
      mockRepository.save.mockResolvedValue(existingCustomer);

      await service.update('1', updateDto);

      expect(existingCustomer.gender).toBe(CustomerGender.FEMALE);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when updating non-existent customer', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        'Customer with ID nonexistent not found',
      );
    });

    it('should validate identification when updating', async () => {
      const existingCustomer = new Customer();
      existingCustomer.id = '1';
      existingCustomer.identification = '12345678901';
      existingCustomer.name = 'John';
      existingCustomer.lastname = 'Doe';

      const updateDto = {
        identification: 'invalid-id',
      };

      // Mock findOne to return different values based on the query
      mockRepository.findOne.mockImplementation((options) => {
        // First call: find customer by ID
        if (options.where.id) {
          return Promise.resolve(existingCustomer);
        }
        // Second call: check for duplicate identification (simulate duplicate found)
        if (options.where.identification === 'invalid-id') {
          const duplicateCustomer = new Customer();
          duplicateCustomer.id = '2';
          duplicateCustomer.identification = 'invalid-id';
          return Promise.resolve(duplicateCustomer);
        }
        return Promise.resolve(null);
      });

      await expect(service.update('1', updateDto)).rejects.toThrow(
        'Customer with identification invalid-id already exists',
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete a customer', async () => {
      const mockCustomer = new Customer();
      mockCustomer.id = '1';
      mockCustomer.status = CustomerStatus.ACTIVE;

      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      await service.softDelete('1');

      expect(mockCustomer.status).toBe(CustomerStatus.INACTIVE);
      expect(mockCustomer.deletedAt).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalledWith(mockCustomer);
    });

    it('should throw error when soft deleting non-existent customer', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        'Customer with ID nonexistent not found',
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft deleted customer', async () => {
      const mockCustomer = new Customer();
      mockCustomer.id = '1';
      mockCustomer.status = CustomerStatus.INACTIVE;
      mockCustomer.deletedAt = new Date();

      // Mock the restore method to actually set deletedAt to null
      const restoreSpy = jest.spyOn(mockCustomer, 'restore').mockImplementation(() => {
        mockCustomer.status = CustomerStatus.ACTIVE;
        mockCustomer.deletedAt = null;
      });

      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.restore('1');

      expect(result.status).toBe(CustomerStatus.ACTIVE);
      expect(result.deletedAt).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        withDeleted: true,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockCustomer);

      restoreSpy.mockRestore();
    });

    it('should throw error when restoring non-existent customer', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(
        'Customer with ID nonexistent not found',
      );
    });
  });
});
