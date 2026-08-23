# contabil-saas

Sistema SaaS multi-tenant para escritórios de contabilidade: cadastro de clientes, módulo fiscal (NFe/NFCe via gateway, com foco inicial em SEFAZ-BA), financeiro e pessoal.

Ver o plano completo em `/root/.claude/plans/swift-jumping-flurry.md` para o contexto e as decisões de arquitetura.

## Estrutura

- `apps/api` — backend NestJS + Prisma (PostgreSQL)
- `apps/web` — frontend Next.js
- `packages/shared` — tipos/enums compartilhados entre api e web

## Rodando localmente

### 1. Banco de dados

Precisa de um Postgres rodando. Configure `apps/api/.env` (copie de `.env.example`):

```
DATABASE_URL="postgresql://user:senha@host:5432/contabil_saas?schema=public"
JWT_SECRET="algo-aleatorio-forte"
```

Depois rode as migrations:

```
cd apps/api
npx prisma migrate dev --name init
```

### 2. API

```
cd apps/api
npm run start:dev
```

Sobe em `http://localhost:3001`. Endpoints atuais:
- `POST /auth/signup` — cria organização (escritório) + usuário admin
- `POST /auth/login`
- `GET/POST/PATCH/DELETE /clients` — CRUD de clientes, isolado por organização
- `POST /notas-fiscais`, `GET /notas-fiscais`, `GET /notas-fiscais/:id`, `POST /notas-fiscais/:id/atualizar-status` — módulo Fiscal (precisa de `FOCUS_NFE_TOKEN`/`FOCUS_NFE_BASE_URL` configurados; sem isso retorna 503 explicando o que falta, nunca finge sucesso)
- `GET/POST/PATCH/DELETE /lancamentos` (aceita `?clientId=` para filtrar) — módulo Financeiro (contas a pagar/receber)
- `GET/POST/PATCH/DELETE /funcionarios` (aceita `?clientId=` para filtrar) — módulo Pessoal

### 3. Web

```
cd apps/web
cp .env.local.example .env.local
npm run dev
```

Sobe em `http://localhost:3000`. Telas: `/`, `/login`, `/signup`, `/dashboard` (lista/cria clientes).

## O que falta configurar (depende de contas externas do usuário)

- **Gateway fiscal**: criar conta no Focus NFe (ou eNotas) e preencher `FOCUS_NFE_TOKEN`/`FOCUS_NFE_BASE_URL`. Os nomes de campo usados no adapter (`apps/api/src/fiscal/gateways/focus-nfe.gateway.ts`) foram escritos com base no conhecimento geral da API do Focus NFe — **confirme contra a documentação atual do provedor antes de emitir notas reais**, pois esses detalhes podem ter mudado.
- **Asaas**: para o módulo financeiro (boletos) e cobrança de assinatura do SaaS — ainda não integrado no código, só planejado.
- **Certificado digital**: cadastrado diretamente no gateway fiscal escolhido, não neste sistema.

## Status dos módulos

Os 4 módulos do MVP (Clientes, Fiscal, Financeiro, Pessoal) têm modelo de dados, service, controller e telas de frontend implementados, isolados por tenant (`organizationId`). Build e boot da API e build de produção do frontend testados sem erros.

- `/dashboard` — lista/cria clientes
- `/dashboard/clients/[id]` — página do cliente com abas Fiscal (emitir/listar notas), Financeiro (lançamentos a pagar/receber, marcar como pago) e Pessoal (funcionários, admissão/demissão)

Testes automatizados (e2e, `apps/api/test/`): auth (signup/login/duplicidade/401), isolamento entre tenants (cross-org retorna 404, nunca vaza dado), e fiscal (rascunho persistido + 503 explícito sem gateway configurado). Rodar com `cd apps/api && npm run test:e2e` (precisa do Postgres de dev configurado em `.env`).

Ainda não implementado: a integração real com o gateway fiscal e a Asaas (dependem de credenciais externas do usuário — sem elas, emitir nota fiscal retorna erro 503 explicando o que falta, em vez de simular sucesso).

## Postgres de desenvolvimento

Se quiser reusar o container que usei para testar:

```
docker run -d --name contabil-saas-postgres-dev \
  -e POSTGRES_USER=contabil -e POSTGRES_PASSWORD=<escolha> -e POSTGRES_DB=contabil_saas \
  -p 127.0.0.1:55432:5432 -v contabil-saas-postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

Isolado (bind só em 127.0.0.1, volume próprio) do resto da infraestrutura compartilhada do appsbrasil.store rodando neste mesmo host via Coolify — não toca em nenhum container de produção existente.
