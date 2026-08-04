import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Honda RC150' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  rate!: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'Paul' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'paul@101digital.io' })
  @IsEmail()
  customerEmail!: string;

  @ApiPropertyOptional({ example: '947717364111' })
  @IsOptional()
  @IsString()
  customerMobile?: string;

  @ApiPropertyOptional({ example: 'Singapore' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ example: 'IV1780488206995' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @ApiPropertyOptional({ example: '#5721662' })
  @IsOptional()
  @IsString()
  invoiceReference?: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString()
  invoiceDate!: string;

  @ApiProperty({ example: '2026-07-03' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 'AUD', enum: ['AUD', 'USD', 'GBP', 'EUR', 'SGD'] })
  @IsString()
  @IsIn(['AUD', 'USD', 'GBP', 'EUR', 'SGD', 'VND'])
  currency!: string;

  @ApiPropertyOptional({ example: 'Invoice is issued to Kanglee' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: CreateInvoiceItemDto })
  @ValidateNested()
  @Type(() => CreateInvoiceItemDto)
  item!: CreateInvoiceItemDto;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxPercent?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;
}
