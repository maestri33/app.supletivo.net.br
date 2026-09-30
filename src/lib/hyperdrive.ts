import postgres from "postgres";

/**
 * Returns a PostgreSQL client connected via Cloudflare Hyperdrive if available on the runtime,
 * falling back to process.env.DATABASE_URL if running locally in Node.js.
 */
export function getDb(runtimeEnv?: any) {
  const connectionString = 
    runtimeEnv?.HYPERDRIVE?.connectionString || 
    process.env.DATABASE_URL ||
    "postgresql://hyperdrive_ro:Hyp3r_v7m_Sec2026_prod@db.v7m.live:5432/backend";

  return postgres(connectionString, {
    max: 5,
    fetch_types: false,
    connect_timeout: 10,
    idle_timeout: 20,
  });
}
