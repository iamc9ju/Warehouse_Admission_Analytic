import { neon } from "@neondatabase/serverless";

export type QueryRow = Record<string, unknown>;

export type QueryClient = {
  query<T extends QueryRow = QueryRow>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
};

export async function connectNeon(databaseUrl: string): Promise<QueryClient> {
  const sql = neon(databaseUrl, { fullResults: true });
  return {
    async query<T extends QueryRow = QueryRow>(queryText: string, values?: unknown[]): Promise<{ rows: T[] }> {
      const result = await sql.query(queryText, values ?? []);
      return { rows: result.rows as T[] };
    },
  };
}
