import pool from './src/config/database';

async function run() {
  try {
    await pool.query('ALTER TABLE approval_steps ADD COLUMN is_priority BOOLEAN DEFAULT FALSE;');
    console.log('Migration done - Added is_priority to approval_steps');
  } catch (e: any) {
    if (e.code === '42701') {
      console.log('Column already exists');
    } else {
      console.error('Migration failed', e);
    }
  } finally {
    process.exit(0);
  }
}

run();
