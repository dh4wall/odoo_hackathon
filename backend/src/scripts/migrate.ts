import pool from "../config/database";

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");

    await client.query(`
      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) NOT NULL DEFAULT 'US';
    `);
    console.log("✔ companies: added currency, country_code");

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log("✔ users: added designation, updated_at");

    console.log("All migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
