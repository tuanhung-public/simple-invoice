import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'reviewer@101digital.io' })
  email!: string;

  @ApiProperty({ example: '101 Digital Reviewer' })
  fullname!: string;

  @ApiPropertyOptional({
    description: 'Present on GET /auth/me; omitted from login response user',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt?: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ type: UserProfileResponseDto })
  user!: UserProfileResponseDto;
}

export class CustomerResponseDto {
  @ApiProperty()
  fullname!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  mobileNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  address?: string | null;
}

export class InvoiceItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  rate!: number;
}

export class InvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  invoiceId!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  invoiceReference?: string | null;

  @ApiProperty({ example: '2026-06-03' })
  invoiceDate!: string;

  @ApiProperty({ example: '2026-07-03' })
  dueDate!: string;

  @ApiProperty({
    example: 'AUD',
    enum: ['AUD', 'USD', 'GBP', 'EUR', 'SGD', 'VND'],
  })
  currency!: string;

  @ApiProperty({ example: 'AU$' })
  currencySymbol!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({
    enum: ['Draft', 'Pending', 'Paid', 'Overdue'],
    description: 'Overdue is derived at read time when unpaid and past due',
  })
  status!: string;

  @ApiProperty()
  invoiceSubTotal!: number;

  @ApiProperty()
  totalTax!: number;

  @ApiProperty()
  totalDiscount!: number;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  totalPaid!: number;

  @ApiProperty()
  balanceAmount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ format: 'uuid' })
  createdBy!: string;

  @ApiProperty({ type: CustomerResponseDto })
  customer!: CustomerResponseDto;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items!: InvoiceItemResponseDto[];
}

export class PagingDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 15 })
  pageSize!: number;

  @ApiProperty({ example: 100 })
  total!: number;
}

export class PaginatedInvoicesResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  data!: InvoiceResponseDto[];

  @ApiProperty({ type: PagingDto })
  paging!: PagingDto;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
    example: ['dueDate must be on or after invoiceDate'],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}
