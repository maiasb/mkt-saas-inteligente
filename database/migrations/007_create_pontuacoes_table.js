const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Removing cliente data columns from links and creating pontuacoes table...');
  
  // Remover colunas desnecessárias de links
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM links
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToRemove = [];
  
  if (columnNames.includes('cliente_nome')) {
    columnsToRemove.push('DROP COLUMN cliente_nome');
  }
  if (columnNames.includes('cliente_email')) {
    columnsToRemove.push('DROP COLUMN cliente_email');
  }
  
  if (columnsToRemove.length > 0) {
    await connection.execute(`
      ALTER TABLE links
      ${columnsToRemove.join(',\n      ')}
    `);
  }

  // Criar tabela de pontuações
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS pontuacoes (
      id VARCHAR(36) PRIMARY KEY,
      empresa_id VARCHAR(50) NOT NULL COMMENT 'ID da empresa',
      cliente_id VARCHAR(50) NOT NULL COMMENT 'ID do cliente na API externa',
      pontos INT NOT NULL DEFAULT 0 COMMENT 'Pontos ganhos',
      tipo ENUM('INDICADOR', 'INDICADO') NOT NULL COMMENT 'Tipo de pontuação',
      link_id VARCHAR(36) NULL COMMENT 'ID do link usado',
      referencia_cliente_id VARCHAR(50) NULL COMMENT 'ID do cliente relacionado',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_empresa_cliente (empresa_id, cliente_id),
      INDEX idx_link (link_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  console.log('Pontuacoes table created and links table updated successfully!');
}

async function down(connection) {
  console.log('Reverting pontuacoes table changes...');
  
  await connection.execute('DROP TABLE IF EXISTS pontuacoes');
  
  // Recriar colunas em links se necessário
  await connection.execute(`
    ALTER TABLE links
    ADD COLUMN cliente_nome VARCHAR(255) NULL,
    ADD COLUMN cliente_email VARCHAR(255) NULL
  `);
  
  console.log('Changes reverted successfully!');
}

module.exports = { up, down };
