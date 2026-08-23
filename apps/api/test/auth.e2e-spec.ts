import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, signupTestOrg, uniqueEmail } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signup cria organização + usuário admin e retorna um token', async () => {
    const { accessToken, organizationId } = await signupTestOrg(app);
    expect(accessToken).toBeDefined();
    expect(organizationId).toBeDefined();
  });

  it('signup com e-mail duplicado retorna 409', async () => {
    const email = uniqueEmail('dup');
    await signupTestOrg(app, { email });

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ organizationName: 'Outro', name: 'Outro', email, password: 'senha12345' })
      .expect(409);
  });

  it('login com credenciais corretas retorna um token', async () => {
    const { email, password } = await signupTestOrg(app);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
  });

  it('login com senha errada retorna 401', async () => {
    const { email } = await signupTestOrg(app);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'senha-errada' })
      .expect(401);
  });

  it('rota protegida sem token retorna 401', async () => {
    await request(app.getHttpServer()).get('/clients').expect(401);
  });
});
