const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Creating users table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      profile_image VARCHAR(500) NULL COMMENT 'URL da imagem de perfil no Cloudinary',
      google_id VARCHAR(500) NULL COMMENT 'ID do Google se logado via Google',
      email_verified BOOLEAN DEFAULT FALSE COMMENT 'Email foi verificado',
      verification_token VARCHAR(255) NULL COMMENT 'Token de verificação de email',
      verification_token_expires TIMESTAMP NULL COMMENT 'Data de expiração do token',
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

module.exports = { up };
