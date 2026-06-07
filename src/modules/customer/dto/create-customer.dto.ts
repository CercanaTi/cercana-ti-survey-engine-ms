import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerGender, CustomerStatus } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer identification number', maxLength: 25 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  identification: string;

  @ApiProperty({ description: 'Customer first name', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Customer last name', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  lastname: string;

  @ApiProperty({ description: 'Customer birth date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  dateBorn: string;

  @ApiProperty({ description: 'Customer gender', enum: CustomerGender })
  @IsNotEmpty()
  @IsEnum(CustomerGender)
  gender: CustomerGender;

  @ApiProperty({ description: 'Customer status', enum: CustomerStatus, required: false })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
