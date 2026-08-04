import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Invoice workflow (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in, creates an invoice, and finds it in the list', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'reviewer@101digital.io',
        password: 'Password123!',
      })
      .expect(201);

    token = loginRes.body.accessToken as string;
    expect(token).toBeTruthy();

    const invoiceNumber = `IV-E2E-${Date.now()}`;

    const createRes = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'E2E Customer',
        customerEmail: `e2e-${Date.now()}@example.com`,
        invoiceNumber,
        invoiceDate: '2026-08-01',
        dueDate: '2026-08-31',
        currency: 'AUD',
        taxPercent: 10,
        discount: 0,
        item: {
          name: 'E2E Item',
          quantity: 2,
          rate: 150,
        },
      })
      .expect(201);

    expect(createRes.body.status).toBe('Draft');
    expect(createRes.body.totalAmount).toBe(330);
    expect(createRes.body.invoiceSubTotal).toBe(300);
    expect(createRes.body.totalTax).toBe(30);

    const listRes = await request(app.getHttpServer())
      .get('/invoices')
      .query({ keyword: invoiceNumber, page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes.body.paging.total).toBeGreaterThanOrEqual(1);
    expect(
      listRes.body.data.some(
        (row: { invoiceNumber: string }) => row.invoiceNumber === invoiceNumber,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'E2E Customer',
        customerEmail: `e2e-dup-${Date.now()}@example.com`,
        invoiceNumber,
        invoiceDate: '2026-08-01',
        dueDate: '2026-08-31',
        currency: 'AUD',
        item: {
          name: 'E2E Item',
          quantity: 1,
          rate: 50,
        },
      })
      .expect(409);
  });
});
