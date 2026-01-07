const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'maia',
    password: process.env.DB_PASSWORD || 'ForTheHorde!',
    database: process.env.DB_NAME || 'dreams_indicacoes',
    multipleStatements: true,
  });

  try {
    console.log('Connected to database');

    // Create migrations tracking table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      const [rows] = await connection.execute(
        'SELECT name FROM migrations WHERE name = ?',
        [file]
      );

      if (rows.length === 0) {
        console.log(`\nRunning migration: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        await migration.up(connection);
        await connection.execute(
          'INSERT INTO migrations (name) VALUES (?)',
          [file]
        );
        console.log(`✓ Migration ${file} completed`);
      } else {
        console.log(`- Migration ${file} already executed`);
      }
    }

    console.log('\n✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);
