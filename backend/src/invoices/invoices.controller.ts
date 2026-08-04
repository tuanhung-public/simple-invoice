import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  InvoiceResponseDto,
  PaginatedInvoicesResponseDto,
} from '../common/dto/api-responses.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List invoices with search, filter, sort, and pagination',
    description:
      'fromDate must be on or before toDate when both are provided. toDate includes the full UTC day.',
  })
  @ApiOkResponse({ type: PaginatedInvoicesResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid query (e.g. fromDate after toDate, pageSize > 100)',
    type: ErrorResponseDto,
  })
  findAll(@Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice detail by ID' })
  @ApiOkResponse({ type: InvoiceResponseDto })
  @ApiBadRequestResponse({
    description: 'id is not a valid UUID v4',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Invoice not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice',
    description:
      'Totals are calculated on the server (tax default 10%, discount default 0). Rejects dueDate before invoiceDate, duplicate invoiceNumber, and discount that makes totalAmount negative. Required strings are trimmed.',
  })
  @ApiCreatedResponse({ type: InvoiceResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed (DTO, dueDate, discount > subtotal+tax, etc.)',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Invoice number must be unique',
    type: ErrorResponseDto,
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.userId, dto);
  }
}
