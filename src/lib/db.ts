import mysql from 'mysql2/promise';

declare global {
  var db: mysql.Pool | undefined;
}

export const db = global.db || mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'maia',
  password: process.env.DB_PASSWORD || 'ForTheHorde!',
  database: process.env.DB_NAME || 'dreams_indicacoes',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

export default db;
