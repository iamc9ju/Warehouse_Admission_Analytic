export type QueryRow = Record<string, unknown>;

export type QueryClient = {
  query<T extends QueryRow = QueryRow>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
};

const poolRegistryKey = Symbol.for("admissions.neon.pool-registry");
const globalWithPools = globalThis as typeof globalThis & {
  [poolRegistryKey]?: Map<string, QueryClient>;
};

export async function connectNeon(databaseUrl: string): Promise<QueryClient> {
  const pools = (globalWithPools[poolRegistryKey] ??= new Map<string, QueryClient>());
  const existing = pools.get(databaseUrl);
  if (existing) return existing;

  // Use official Neon serverless HTTP driver when connecting to Neon cloud (e.g. Cloudflare Workers)
  if (databaseUrl.includes("neon.tech")) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(databaseUrl, { fullResults: true });
    const client: QueryClient = {
      async query<T extends QueryRow = QueryRow>(queryText: string, values?: unknown[]): Promise<{ rows: T[] }> {
        const result = await sql.query(queryText, values ?? []);
        const rows = (result && "rows" in result && Array.isArray(result.rows)) ? result.rows : (Array.isArray(result) ? result : []);
        return { rows: rows as T[] };
      },
    };
    pools.set(databaseUrl, client);
    return client;
  }

  // Standard PostgreSQL connection for Docker / Local container environments
  const pgModule = await import("pg");
  const PoolClass = pgModule.default?.Pool ?? pgModule.Pool;
  const isLocalOrInternal =
    databaseUrl.includes("sslmode=disable") ||
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("@db:") ||
    databaseUrl.includes("@postgres:");

  const pool = new PoolClass({
    connectionString: databaseUrl,
    ssl: isLocalOrInternal ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  const client: QueryClient = {
    async query<T extends QueryRow = QueryRow>(queryText: string, values?: unknown[]): Promise<{ rows: T[] }> {
      const result = await pool.query(queryText, values);
      return { rows: result.rows as T[] };
    },
  };
  pools.set(databaseUrl, client);
  return client;
}
