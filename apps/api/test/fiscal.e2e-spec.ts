import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, createTestClient, signupTestOrg } from './helpers';

describe('Fiscal (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('emitir nota fiscal sem gateway configurado retorna 503 e persiste o rascunho', async () => {
    const org = await signupTestOrg(app);
    const client = await createTestClient(app, org.accessToken);

    // Ambiente de teste roda sem FOCUS_NFE_TOKEN/FOCUS_NFE_BASE_URL de propósito:
    // a chamada deve falhar de forma explícita, nunca simular uma nota autorizada.
    const res = await request(app.getHttpServer())
      .post('/notas-fiscais')
      .set('Authorization', `Bearer ${org.accessToken}`)
      .send({ clientId: client.id, tipo: 'NFE', descricao: 'Venda de teste', valorTotal: 100 })
      .expect(503);

    expect(res.body.message).toContain('Gateway fiscal');

    const listRes = await request(app.getHttpServer())
      .get(`/notas-fiscais?clientId=${client.id}`)
      .set('Authorization', `Bearer ${org.accessToken}`)
      .expect(200);

    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].status).toBe('RASCUNHO');
  });

  it('emitir nota fiscal para cliente inexistente retorna 404', async () => {
    const org = await signupTestOrg(app);

    await request(app.getHttpServer())
      .post('/notas-fiscais')
      .set('Authorization', `Bearer ${org.accessToken}`)
      .send({
        clientId: '00000000-0000-0000-0000-000000000000',
        tipo: 'NFE',
        descricao: 'Venda de teste',
        valorTotal: 100,
      })
      .expect(404);
  });
});
