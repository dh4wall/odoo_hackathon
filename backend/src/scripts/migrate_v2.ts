import fs from "fs";
import path from "path";
import pool from "../config/database";

const runMigration = async () => {
  try {
    const schemaPath = path.join(__dirname, "schema_v2.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");
    console.log("Starting Phase 2 Database Migration...");
    await pool.query(sql);
    console.log("Migration executed successfully! New domain tables added.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
};

runMigration();
