import fs from 'fs';
import path from 'path';
import { query } from '../config/database';

interface Migration {
  id: number;
  filename: string;
  executed_at: Date;
}

const MIGRATIONS_DIR = __dirname;

// Create migrations tracking table
const createMigrationsTable = async (): Promise<void> => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  await query(createTableQuery);
};

// Get executed migrations
const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await query('SELECT filename FROM migrations ORDER BY id');
  return result.rows.map((row: Migration) => row.filename);
};

// Execute a single migration
const executeMigration = async (filename: string): Promise<void> => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`Executing migration: ${filename}`);
  
  try {
    // Execute the migration SQL
    await query(sql);
    
    // Record the migration as executed
    await query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
    
    console.log(`✓ Migration ${filename} executed successfully`);
  } catch (error) {
    console.error(`✗ Migration ${filename} failed:`, error);
    throw error;
  }
};

// Run all pending migrations
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Get list of migration files
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// CLI runner
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}