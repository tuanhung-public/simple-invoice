import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimOptionalString({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

class CreateInvoiceItemDto {
  @ApiProperty({
    example: 'Honda RC150',
    description: 'Trimmed; whitespace-only rejected',
  })
  @Transform(trimString)
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
  @ApiProperty({
    example: 'Paul',
    description: 'Trimmed; whitespace-only rejected',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({
    example: 'paul@101digital.io',
    description: 'Trimmed before validation',
  })
  @Transform(trimString)
  @IsEmail()
  customerEmail!: string;

  @ApiPropertyOptional({ example: '947717364111' })
  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  customerMobile?: string;

  @ApiPropertyOptional({ example: 'Singapore' })
  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  customerAddress?: string;

  @ApiProperty({
    example: 'IV1780488206995',
    description: 'Must be unique; trimmed; whitespace-only rejected',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @ApiPropertyOptional({ example: '#5721662' })
  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  invoiceReference?: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString()
  invoiceDate!: string;

  @ApiProperty({
    example: '2026-07-03',
    description: 'Must be on or after invoiceDate',
  })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({
    example: 'AUD',
    enum: ['AUD', 'USD', 'GBP', 'EUR', 'SGD', 'VND'],
  })
  @IsString()
  @IsIn(['AUD', 'USD', 'GBP', 'EUR', 'SGD', 'VND'])
  currency!: string;

  @ApiPropertyOptional({ example: 'Invoice is issued to Kanglee' })
  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  description?: string;

  @ApiProperty({ type: CreateInvoiceItemDto })
  @ValidateNested()
  @Type(() => CreateInvoiceItemDto)
  item!: CreateInvoiceItemDto;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 0,
    maximum: 1000,
    description: 'Percent; omitted → 10',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  taxPercent?: number;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    minimum: 0,
    description:
      'Absolute amount; omitted → 0. Must not exceed subtotal + tax (totalAmount ≥ 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;
}
