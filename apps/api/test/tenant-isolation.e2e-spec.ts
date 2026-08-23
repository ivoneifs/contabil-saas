import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, createTestClient, signupTestOrg } from './helpers';

describe('Isolamento entre tenants (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('usuário de uma organização não consegue ler cliente de outra organização', async () => {
    const orgA = await signupTestOrg(app);
    const orgB = await signupTestOrg(app);
    const client = await createTestClient(app, orgA.accessToken);

    await request(app.getHttpServer())
      .get(`/clients/${client.id}`)
      .set('Authorization', `Bearer ${orgA.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/clients/${client.id}`)
      .set('Authorization', `Bearer ${orgB.accessToken}`)
      .expect(404);
  });

  it('lista de clientes de uma organização não inclui clientes de outra', async () => {
    const orgA = await signupTestOrg(app);
    const orgB = await signupTestOrg(app);
    await createTestClient(app, orgA.accessToken, { razaoSocial: 'Só da org A' });

    const res = await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${orgB.accessToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('não é possível criar lançamento financeiro para cliente de outra organização', async () => {
    const orgA = await signupTestOrg(app);
    const orgB = await signupTestOrg(app);
    const client = await createTestClient(app, orgA.accessToken);

    await request(app.getHttpServer())
      .post('/lancamentos')
      .set('Authorization', `Bearer ${orgB.accessToken}`)
      .send({
        clientId: client.id,
        tipo: 'A_RECEBER',
        descricao: 'Tentativa cross-tenant',
        valor: 100,
        vencimento: '2026-12-31',
      })
      .expect(404);
  });
});
