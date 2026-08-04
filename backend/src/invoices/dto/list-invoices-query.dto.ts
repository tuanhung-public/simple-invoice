import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListInvoicesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 15, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 15;

  @ApiPropertyOptional({
    enum: ['invoiceDate', 'dueDate', 'totalAmount'],
    default: 'invoiceDate',
  })
  @IsOptional()
  @IsIn(['invoiceDate', 'dueDate', 'totalAmount'])
  sortBy?: 'invoiceDate' | 'dueDate' | 'totalAmount' = 'invoiceDate';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  ordering?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ enum: ['Draft', 'Pending', 'Paid', 'Overdue'] })
  @IsOptional()
  @IsIn(['Draft', 'Pending', 'Paid', 'Overdue'])
  status?: 'Draft' | 'Pending' | 'Paid' | 'Overdue';

  @ApiPropertyOptional({
    description: 'Partial search on invoice number or customer name',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Inclusive start of invoiceDate range (UTC day)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description:
      'Inclusive end of invoiceDate range (full UTC day). Must be ≥ fromDate when both set',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
