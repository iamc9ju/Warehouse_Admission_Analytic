export type QueryRow = Record<string, unknown>;

export type QueryClient = {
  query<T extends QueryRow = QueryRow>(sql: string, values?: number[]): Promise<{ rows: T[] }>;
  end(): Promise<void>;
};

type PgModule = {
  Client: new (config: {
    connectionString: string;
    ssl?: { rejectUnauthorized: boolean };
    connectionTimeoutMillis: number;
    query_timeout: number;
    statement_timeout: number;
  }) => QueryClient & { connect(): Promise<void> };
};

export async function connectNeon(databaseUrl: string): Promise<QueryClient> {
  const pg = (await import("pg")) as unknown as PgModule;
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=disable") ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000,
    query_timeout: 5000,
    statement_timeout: 5000,
  });
  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.end().catch(() => undefined);
    throw error;
  }
}
