import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  await app.init();
  return app;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@teste.com`;
}

export async function signupTestOrg(
  app: INestApplication,
  overrides: Partial<{ organizationName: string; name: string; email: string; password: string }> = {},
) {
  const body = {
    organizationName: overrides.organizationName ?? 'Escritorio E2E',
    name: overrides.name ?? 'Admin E2E',
    email: overrides.email ?? uniqueEmail('admin'),
    password: overrides.password ?? 'senha12345',
  };

  const res = await request(app.getHttpServer()).post('/auth/signup').send(body).expect(201);

  return {
    accessToken: res.body.accessToken as string,
    organizationId: res.body.organization.id as string,
    email: body.email,
    password: body.password,
  };
}

export async function createTestClient(app: INestApplication, token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app.getHttpServer())
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({
      razaoSocial: 'Cliente E2E',
      cnpjCpf: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      uf: 'BA',
      ...overrides,
    })
    .expect(201);

  return res.body;
}
