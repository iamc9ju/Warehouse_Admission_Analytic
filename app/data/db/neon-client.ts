export type QueryRow = Record<string, unknown>;

export type QueryClient = {
  query<T extends QueryRow = QueryRow>(sql: string, values?: number[]): Promise<{ rows: T[] }>;
};

type PgModule = {
  Pool: new (config: {
    connectionString: string;
    ssl?: { rejectUnauthorized: boolean };
    connectionTimeoutMillis: number;
    query_timeout: number;
    statement_timeout: number;
    max: number;
    idleTimeoutMillis: number;
    allowExitOnIdle: boolean;
  }) => QueryClient;
};

const poolRegistryKey = Symbol.for("admissions.neon.pool-registry");
const globalWithPools = globalThis as typeof globalThis & {
  [poolRegistryKey]?: Map<string, QueryClient>;
};

export async function connectNeon(databaseUrl: string): Promise<QueryClient> {
  const pools = globalWithPools[poolRegistryKey] ??= new Map<string, QueryClient>();
  const existing = pools.get(databaseUrl);
  if (existing) return existing;

  const pg = (await import("pg")) as unknown as PgModule;
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=disable") ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    query_timeout: 15000,
    statement_timeout: 15000,
    max: 5,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: true,
  });
  pools.set(databaseUrl, pool);
  return pool;
}
