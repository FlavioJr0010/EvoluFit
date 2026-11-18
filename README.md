# EvoluFit

Aplicação web pessoal para registrar dieta, treinos, peso e hidratação, com relatórios e gráficos de evolução física.

- Requisitos: [`Especificacao_Requisitos_Sistema_Saude_Pessoal.md`](Especificacao_Requisitos_Sistema_Saude_Pessoal.md)
- Decisões da V1 (prevalecem sobre a especificação): [`DECISOES_V1.md`](DECISOES_V1.md)

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Cache Components, Partial Prefetching) + React 19 |
| Linguagem | TypeScript (strict) |
| Banco e autenticação | Supabase: PostgreSQL + Supabase Auth + Row Level Security |
| Acesso a dados | `@supabase/ssr` + `@supabase/supabase-js` (sem ORM — ver [Por que não usar ORM](#por-que-não-usar-orm)) |
| Validação | Zod (Server Actions e formulários) |
| Interface | Tailwind CSS 4 + shadcn/ui (Base UI) |
| Testes | Vitest |
| Hospedagem | Vercel |

## Pré-requisitos

- Node.js 24
- Docker (banco local para validar migrations e RLS)

## Primeiros passos

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a chave publicável do Supabase
npm run db:up                # sobe o banco local (Docker)
npm run db:migrate           # aplica as migrations no banco local
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Onde obter | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Painel do Supabase → Project Settings → API Keys | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Painel do Supabase → Project Settings → API Keys | Chave publicável (`sb_publishable_…`), segura no navegador |

Arquivos:

- `.env.local` — usado por `npm run dev` (e também por `build`/`start`).
- `.env.production.local` — usado apenas por `next build` / `next start`.
- `.env.example` — modelo versionado. Todos os demais `.env*` são ignorados pelo git.

> A chave secreta (`sb_secret_…` / `service_role`) e a senha do banco **não** são usadas pelo app e não devem ser colocadas em nenhum `.env` do projeto. Ambas ignoram o RLS.

## Banco de dados local (Docker)

O `docker-compose.yml` sobe um único container Postgres para desenvolvimento.

| Item | Valor |
|---|---|
| Container | `evolufit-db` |
| Imagem | `public.ecr.aws/supabase/postgres:17.12.0.000` |
| Porta | `55432` (somente `127.0.0.1`, não exposto na rede) |
| Conexão | `postgresql://postgres:postgres@127.0.0.1:55432/postgres` |
| Dados | volume Docker `evolufit-db-data` (persiste entre reinícios) |

**Por que a imagem do Supabase e não o Postgres oficial:** ela é a mesma linha do Postgres do projeto hospedado e já inclui os roles `anon`, `authenticated` e `service_role`, o schema `auth`, a tabela `auth.users` e a função `auth.uid()`. As políticas RLS dependem disso — num Postgres puro elas não compilariam.

A porta e a senha podem ser alteradas com `EVOLUFIT_DB_PORT` e `EVOLUFIT_DB_PASSWORD` (nesse caso, ajuste também as URLs dos scripts `db:migrate` e `db:types` no `package.json`).

### Comandos

```bash
npm run db:up        # sobe o banco e aguarda ficar saudável
npm run db:migrate   # aplica supabase/migrations no banco local
npm run db:psql      # abre o psql dentro do container
npm run db:reset     # apaga o volume, recria o banco e reaplica as migrations
npm run db:down      # para o banco (os dados ficam no volume)
npm run db:types     # gera src/lib/supabase/database.types.ts a partir do banco local
```

### Fluxo de migrations

1. Criar a migration em `supabase/migrations/` (SQL versionado).
2. Aplicar e validar no banco local: `npm run db:migrate` (ou `npm run db:reset` para começar do zero).
3. Gerar os tipos: `npm run db:types`.
4. Somente depois de validada, aplicar no projeto remoto pelo Supabase CLI (`npx supabase link` uma única vez — pede a senha do banco de forma interativa, sem salvá-la no projeto — e depois `npx supabase db push --remote`).

## Autenticação

Uso pessoal, conta única:

- **Sem tela de cadastro.** A conta é criada no painel do Supabase.
- **Sem confirmação de e-mail.**
- **Login** por e-mail e senha e **recuperação de senha** por e-mail.
- Senha: mínimo de 8 caracteres, com letras e números.

### Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Público | Login por e-mail e senha |
| `/esqueci-senha` | Público | Solicita o link de redefinição (resposta genérica, não revela se o e-mail existe) |
| `/auth/confirm` | Público | Destino do link do e-mail; valida o `token_hash` (ou `code` PKCE) e cria a sessão |
| `/redefinir-senha` | Autenticado | Define a nova senha após o link de recuperação |
| `/` | Autenticado | Dashboard (resumo do dia) |

### Como a sessão é protegida

- **`src/proxy.ts`** (antigo *middleware* no Next.js 16): renova a sessão a cada requisição e redireciona para `/login` quem não está autenticado. É uma checagem otimista.
- **`src/lib/auth/session.ts`** (Data Access Layer): `getCurrentUser()` valida o JWT com `getClaims()` perto dos dados. O projeto usa chaves assimétricas (ES256), então a validação é local, sem chamar o servidor de auth.
- **Server Actions** revalidam a sessão antes de qualquer alteração.
- **RLS no banco** é a garantia final: mesmo que uma query esqueça um filtro, o banco só devolve dados do próprio usuário.
- **Redirecionamentos** aceitam apenas caminhos internos (bloqueia *open redirect* como `//evil.com`).

## Configuração do projeto Supabase remoto

As configurações de `supabase/config.toml` valem apenas localmente. No painel do projeto remoto:

1. **Authentication → Users → Add user**: criar a conta pessoal.
2. **Authentication → Sign In / Providers**: desligar **Allow new users to sign up** e **Confirm email** (depois de criar a conta).
3. **Authentication → URL Configuration**: definir **Site URL** (URL de produção na Vercel) e adicionar em **Redirect URLs** `http://localhost:3000/**` e a URL de produção com `/**`.
4. **Authentication → Emails → Reset password**: usar o template de `supabase/templates/recovery.html` (link para `/auth/confirm` com `token_hash`).
5. **Project Settings → API Keys**: se uma chave secreta tiver sido compartilhada fora do painel, criar uma nova e revogar a antiga.

O SMTP padrão do Supabase tem limite baixo de envios por hora — suficiente para recuperação de senha em uso pessoal.

## Estrutura do projeto

```
src/
  app/
    (auth)/              # login, esqueci-senha, redefinir-senha + Server Actions de auth
    (app)/               # área autenticada (layout com cabeçalho, dashboard)
    auth/confirm/        # Route Handler dos links de e-mail
    layout.tsx           # layout raiz (pt-BR)
  components/
    forms/               # TextField, FormMessage (campos acessíveis com erros)
    ui/                  # componentes shadcn/ui
  lib/
    auth/                # sessão (DAL), schemas Zod, rotas públicas e redirect seguro
    supabase/            # clients do Supabase (server e proxy)
    validation/          # decimal pt-BR ("8,2" → 8.2) para Zod
    env.ts               # validação das variáveis públicas
    forms.ts             # estado padrão das Server Actions de formulário
  proxy.ts               # renovação de sessão e proteção de rotas
supabase/
  config.toml            # configuração do Supabase CLI (auth local, templates)
  migrations/            # migrations SQL versionadas
  templates/             # templates de e-mail (recuperação de senha)
docker-compose.yml       # banco Postgres local (porta 55432)
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção (após o build) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos |
| `npm test` / `npm run test:watch` | Testes unitários (Vitest) |
| `npm run test:db` | Testes de integração do banco: RLS e regras (requer `db:up` + `db:migrate`) |
| `npm run db:*` | Banco local (ver [Comandos](#comandos)) |

## Testes

`npm test` cobre hoje:

- conversão de decimais em pt-BR (`8,2`, `1.234,5`), com vazio = `null` (“não cadastrado”) diferente de zero;
- schemas de login e senha (mensagens em português);
- rotas públicas e bloqueio de *open redirect*;
- leitura segura de campos de formulário.

Os próximos módulos devem incluir testes para cálculo proporcional de nutrientes, receitas, volume de treino, médias móveis e testes de RLS (tentativas de acessar dados de outro usuário).

## Segurança

- A chave `service_role`/secret e a senha do banco nunca vão para o cliente nem para variáveis `NEXT_PUBLIC_`.
- Todas as tabelas — inclusive as filhas — têm `user_id` e RLS.
- As políticas validam também a posse dos registros relacionados (um item não pode apontar para alimento, receita ou treino de outro usuário), reforçadas por chaves compostas `(id, user_id)`.

### Por que não usar ORM

ORMs como o Prisma conectam com o usuário `postgres`, que **ignora o RLS**. O isolamento entre usuários passaria a depender de cada query lembrar do filtro `user_id`. Com o client do Supabase, toda consulta chega ao banco como o usuário autenticado e o RLS garante o isolamento. Migrations ficam em SQL (com suporte completo a políticas, checks e chaves compostas) e os tipos TypeScript são gerados a partir do banco (`npm run db:types`).

## Status da implementação

| Etapa | Situação |
|---|---|
| 1. Next.js, TypeScript, Supabase, variáveis de ambiente e autenticação | ✅ Concluída |
| 2. Migrations, tipos TypeScript e RLS | ✅ Concluída |
| 3. Registro diário de peso e água + gráfico de peso | ✅ Concluída |
| 4. Cadastro de alimentos e cálculo proporcional | ✅ Concluída |
| 5. Refeições do dia e totais nutricionais | Pendente |
| 6. Exercícios, treinos e séries | Pendente |
| 7. Relatórios e gráficos de evolução de treino | Pendente |
| 8. Revisão mobile, validações, mensagens de erro e estados vazios | Pendente |
