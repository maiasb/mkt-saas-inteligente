const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Removing foreign key constraints and empresas table...');
  
  // Remove foreign key de links para empresas
  try {
    await connection.execute(`
      ALTER TABLE links DROP FOREIGN KEY links_ibfk_1
    `);
  } catch (err) {
    console.log('links_ibfk_1 constraint may not exist or already removed');
  }
  
  // Remove foreign key de clientes para empresas (se existir)
  try {
    await connection.execute(`
      ALTER TABLE clientes DROP FOREIGN KEY clientes_ibfk_1
    `);
  } catch (err) {
    console.log('clientes table may not exist or constraint already removed');
  }
  
  // Remove tabela de empresas (não é mais necessária, empresas são hard-coded)
  await connection.execute(`
    DROP TABLE IF EXISTS empresas
  `);
  
  console.log('Foreign keys removed and empresas table dropped successfully!');
}

async function down(connection) {
  console.log('Recreating empresas table and foreign keys...');
  
  // Recriar tabela empresas
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS empresas (
      id VARCHAR(36) PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      telefone VARCHAR(50),
      cnpj VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // Recriar foreign key de links
  await connection.execute(`
    ALTER TABLE links
    ADD CONSTRAINT links_ibfk_1 
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  `);
  
  console.log('Empresas table and foreign keys recreated successfully!');
}

module.exports = { up, down };
