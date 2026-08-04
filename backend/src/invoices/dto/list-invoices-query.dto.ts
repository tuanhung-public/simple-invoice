import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ListInvoicesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

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

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
