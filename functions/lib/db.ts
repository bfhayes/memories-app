// Thin helpers over the raw D1 prepared-statement API. We use raw SQL (not an ORM)
// because the library list endpoint needs dynamic filtering + aggregation that reads
// far more clearly as SQL.

export type Row = Record<string, unknown>;

export async function all<T = Row>(
  db: D1Database,
  sql: string,
  ...args: unknown[]
): Promise<T[]> {
  const res = await db.prepare(sql).bind(...args).all<T>();
  return res.results ?? [];
}

export async function first<T = Row>(
  db: D1Database,
  sql: string,
  ...args: unknown[]
): Promise<T | null> {
  const row = await db.prepare(sql).bind(...args).first<T>();
  return row ?? null;
}

export async function run(
  db: D1Database,
  sql: string,
  ...args: unknown[]
): Promise<D1Result> {
  return db.prepare(sql).bind(...args).run();
}

export function stmt(db: D1Database, sql: string, ...args: unknown[]): D1PreparedStatement {
  return db.prepare(sql).bind(...args);
}

export function nowIso(): string {
  return new Date().toISOString();
}
