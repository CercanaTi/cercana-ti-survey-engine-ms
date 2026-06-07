import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';

export enum CustomerGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

@Entity('customers')
export class Customer {
  @ApiProperty({ description: 'Customer unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Customer identification number', maxLength: 25 })
  @Column({ type: 'varchar', length: 25, unique: true })
  identification: string;

  @ApiProperty({ description: 'Customer first name', maxLength: 50 })
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @ApiProperty({ description: 'Customer last name', maxLength: 50 })
  @Column({ type: 'varchar', length: 50 })
  lastname: string;

  @ApiProperty({ description: 'Customer birth date' })
  @Column({ type: 'date' })
  dateBorn: Date;

  @ApiProperty({ description: 'Customer gender', enum: CustomerGender })
  @Column({ type: 'enum', enum: CustomerGender, nullable: true })
  gender: CustomerGender;

  @ApiProperty({ description: 'Customer status', enum: CustomerStatus })
  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.PENDING })
  status: CustomerStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createDate: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updateDate: Date;

  @ApiProperty({ description: 'Soft delete timestamp', required: false })
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  validateIdentification(): void {
    if (!this.identification || this.identification.length === 0) {
      throw new BadRequestException('Identification is required');
    }
    if (this.identification.length > 25) {
      throw new BadRequestException('Identification must not exceed 25 characters');
    }
  }

  validateName(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new BadRequestException('Name is required');
    }
    if (this.name.length > 50) {
      throw new BadRequestException('Name must not exceed 50 characters');
    }
  }

  validateLastname(): void {
    if (!this.lastname || this.lastname.trim().length === 0) {
      throw new BadRequestException('Lastname is required');
    }
    if (this.lastname.length > 50) {
      throw new BadRequestException('Lastname must not exceed 50 characters');
    }
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.status = CustomerStatus.INACTIVE;
  }

  restore(): void {
    this.deletedAt = null;
    this.status = CustomerStatus.ACTIVE;
  }
}
