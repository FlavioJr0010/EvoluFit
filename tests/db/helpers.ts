import { randomUUID } from "node:crypto";

import pg from "pg";

export const DATABASE_URL =
  process.env.EVOLUFIT_TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:55432/postgres";

export type Db = pg.Client;

export async function connect(): Promise<Db> {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  return client;
}

/** Cria um usuário em auth.users (o trigger cria o perfil). */
export async function createUser(db: Db): Promise<string> {
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, email, aud, role) values ($1, $2, 'authenticated', 'authenticated')`,
    [id, `teste-${id}@example.com`],
  );
  return id;
}

export async function deleteUsers(db: Db, ids: string[]) {
  if (ids.length) await db.query(`delete from auth.users where id = any($1::uuid[])`, [ids]);
}

/**
 * Executa `fn` como o usuário autenticado `userId`, do mesmo modo que o
 * PostgREST: role `authenticated` + claims do JWT na transação.
 * Sempre faz ROLLBACK, a menos que `commit` seja true.
 */
export async function asUser<T>(
  db: Db,
  userId: string | null,
  fn: (db: Db) => Promise<T>,
  { commit = false } = {},
): Promise<T> {
  await db.query("begin");
  try {
    if (userId) {
      await db.query("set local role authenticated");
      await db.query(
        `select set_config('request.jwt.claim.sub', $1, true),
                set_config('request.jwt.claims', $2, true)`,
        [userId, JSON.stringify({ sub: userId, role: "authenticated" })],
      );
    } else {
      await db.query("set local role anon");
    }
    const result = await fn(db);
    await db.query(commit ? "commit" : "rollback");
    return result;
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

/** Retorna o SQLSTATE do erro lançado por `fn` (ou null se não falhar). */
export async function errorCode(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (error) {
    return (error as { code?: string }).code ?? "unknown";
  }
}

export const PG = {
  RLS_VIOLATION: "42501",
  FK_VIOLATION: "23503",
  UNIQUE_VIOLATION: "23505",
  CHECK_VIOLATION: "23514",
  INVALID_PARAMETER: "22023",
  NO_DATA_FOUND: "P0002",
} as const;

/**
 * Executa uma query dentro de um SAVEPOINT e devolve o SQLSTATE do erro
 * (ou null). Permite várias tentativas na mesma transação.
 */
export async function attempt(db: Db, sql: string, params: unknown[] = []): Promise<string | null> {
  await db.query("savepoint attempt");
  try {
    await db.query(sql, params);
    await db.query("release savepoint attempt");
    return null;
  } catch (error) {
    await db.query("rollback to savepoint attempt");
    return (error as { code?: string }).code ?? "unknown";
  }
}
