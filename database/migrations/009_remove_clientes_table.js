const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Removing clientes foreign key and table...');
  
  // Remove foreign key de links para clientes
  try {
    await connection.execute(`
      ALTER TABLE links DROP FOREIGN KEY links_ibfk_2
    `);
    console.log('Foreign key links_ibfk_2 removed successfully');
  } catch (err) {
    console.log('links_ibfk_2 constraint may not exist or already removed');
  }
  
  // Remove tabela de clientes (não é mais necessária, dados vêm da API externa)
  await connection.execute(`
    DROP TABLE IF EXISTS clientes
  `);
  console.log('Clientes table dropped successfully');
  
  console.log('Migration completed - links now store only cliente_id as string reference to external API!');
}

async function down(connection) {
  console.log('Recreating clientes table and foreign key...');
  
  // Recriar tabela clientes
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS clientes (
      id VARCHAR(36) PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefone VARCHAR(50),
      empresa_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_empresa_id (empresa_id),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // Recriar foreign key de links
  await connection.execute(`
    ALTER TABLE links
    ADD CONSTRAINT links_ibfk_2
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  `);
  
  console.log('Clientes table and foreign key recreated successfully!');
}

module.exports = { up, down };
