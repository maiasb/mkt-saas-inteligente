const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding cliente_id to links table...');
  await connection.execute(`
    ALTER TABLE links
    ADD COLUMN cliente_id VARCHAR(36) NULL AFTER empresa_id,
    ADD INDEX idx_cliente_id (cliente_id),
    ADD FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  `);
}

module.exports = { up };
