const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Creating indicacoes table and migrating data...');
  
  // Criar tabela de indicações
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS indicacoes (
      id VARCHAR(36) PRIMARY KEY,
      empresa_id VARCHAR(50) NOT NULL COMMENT 'ID da empresa',
      indicador_id VARCHAR(50) NOT NULL COMMENT 'ID do cliente que indicou',
      indicado_id VARCHAR(50) NOT NULL COMMENT 'ID do cliente que foi indicado',
      link_id VARCHAR(36) NOT NULL COMMENT 'ID do link usado',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_indicador (indicador_id),
      INDEX idx_indicado (indicado_id),
      INDEX idx_empresa (empresa_id),
      INDEX idx_link (link_id),
      UNIQUE KEY unique_indicacao (indicador_id, indicado_id, link_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('Indicacoes table created!');

  // Migrar dados existentes de pontuacoes para indicacoes
  console.log('Migrating existing data from pontuacoes to indicacoes...');
  
  await connection.execute(`
    INSERT IGNORE INTO indicacoes (id, empresa_id, indicador_id, indicado_id, link_id, created_at)
    SELECT 
      UUID() as id,
      empresa_id,
      cliente_id as indicador_id,
      referencia_cliente_id as indicado_id,
      link_id,
      created_at
    FROM pontuacoes
    WHERE tipo = 'INDICADOR' 
      AND referencia_cliente_id IS NOT NULL
      AND link_id IS NOT NULL
  `);

  console.log('Data migrated successfully!');

  // Simplificar tabela pontuacoes removendo campos agora desnecessários
  console.log('Simplifying pontuacoes table...');
  
  const [columns] = await connection.execute('SHOW COLUMNS FROM pontuacoes');
  const columnNames = columns.map((col) => col.Field);
  
  const columnsToRemove = [];
  
  if (columnNames.includes('tipo')) {
    columnsToRemove.push('DROP COLUMN tipo');
  }
  if (columnNames.includes('referencia_cliente_id')) {
    columnsToRemove.push('DROP COLUMN referencia_cliente_id');
  }
  
  if (columnsToRemove.length > 0) {
    await connection.execute(`
      ALTER TABLE pontuacoes
      ${columnsToRemove.join(',\n      ')}
    `);
    console.log('Pontuacoes table simplified - removed tipo and referencia_cliente_id columns');
  }
  
  console.log('Migration 010 completed successfully!');
}

async function down(connection) {
  console.log('Reverting indicacoes table changes...');
  
  // Recriar colunas em pontuacoes
  await connection.execute(`
    ALTER TABLE pontuacoes
    ADD COLUMN tipo ENUM('INDICADOR', 'INDICADO') NULL,
    ADD COLUMN referencia_cliente_id VARCHAR(50) NULL
  `);
  
  // Dropar tabela indicacoes
  await connection.execute('DROP TABLE IF EXISTS indicacoes');
  
  console.log('Changes reverted successfully!');
}

module.exports = { up, down };
