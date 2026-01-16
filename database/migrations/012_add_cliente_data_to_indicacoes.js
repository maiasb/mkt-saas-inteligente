const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding cliente data columns to indicacoes table...');
  
  // Verificar quais colunas já existem
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM indicacoes
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToAdd = [];
  
  // Colunas de dados do indicado (quem foi indicado)
  if (!columnNames.includes('indicado_nome')) {
    columnsToAdd.push("ADD COLUMN indicado_nome VARCHAR(255) NULL COMMENT 'Nome do cliente indicado'");
  }
  if (!columnNames.includes('indicado_email')) {
    columnsToAdd.push("ADD COLUMN indicado_email VARCHAR(255) NULL COMMENT 'Email do cliente indicado'");
  }
  if (!columnNames.includes('indicado_telefone')) {
    columnsToAdd.push("ADD COLUMN indicado_telefone VARCHAR(20) NULL COMMENT 'Telefone do cliente indicado'");
  }
  if (!columnNames.includes('indicado_cpf')) {
    columnsToAdd.push("ADD COLUMN indicado_cpf VARCHAR(20) NULL COMMENT 'CPF/CNPJ do cliente indicado'");
  }
  
  // Adicionar colunas se necessário
  if (columnsToAdd.length > 0) {
    await connection.execute(`
      ALTER TABLE indicacoes
      ${columnsToAdd.join(',\n      ')}
    `);
    console.log(`Added ${columnsToAdd.length} columns to indicacoes table`);
  } else {
    console.log('All columns already exist in indicacoes table');
  }
  
  // Adicionar índices para melhorar performance
  const [indexes] = await connection.execute(`
    SHOW INDEX FROM indicacoes WHERE Key_name IN ('idx_indicado_cpf', 'idx_indicado_email')
  `);
  
  const indexNames = [...new Set(indexes.map((idx) => idx.Key_name))];
  
  if (!indexNames.includes('idx_indicado_cpf')) {
    await connection.execute(`
      CREATE INDEX idx_indicado_cpf ON indicacoes(indicado_cpf)
    `);
    console.log('Created index idx_indicado_cpf');
  }
  
  if (!indexNames.includes('idx_indicado_email')) {
    await connection.execute(`
      CREATE INDEX idx_indicado_email ON indicacoes(indicado_email)
    `);
    console.log('Created index idx_indicado_email');
  }
  
  console.log('Cliente data columns and indexes added to indicacoes successfully!');
}

async function down(connection) {
  console.log('Removing cliente data columns from indicacoes table...');
  
  // Remover índices
  const [indexes] = await connection.execute(`
    SHOW INDEX FROM indicacoes WHERE Key_name IN ('idx_indicado_cpf', 'idx_indicado_email')
  `);
  
  const indexNames = [...new Set(indexes.map((idx) => idx.Key_name))];
  
  for (const indexName of indexNames) {
    await connection.execute(`
      DROP INDEX ${indexName} ON indicacoes
    `);
    console.log(`Dropped index ${indexName}`);
  }
  
  // Remover colunas
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM indicacoes
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToRemove = [];
  
  if (columnNames.includes('indicado_nome')) {
    columnsToRemove.push('DROP COLUMN indicado_nome');
  }
  if (columnNames.includes('indicado_email')) {
    columnsToRemove.push('DROP COLUMN indicado_email');
  }
  if (columnNames.includes('indicado_telefone')) {
    columnsToRemove.push('DROP COLUMN indicado_telefone');
  }
  if (columnNames.includes('indicado_cpf')) {
    columnsToRemove.push('DROP COLUMN indicado_cpf');
  }
  
  if (columnsToRemove.length > 0) {
    await connection.execute(`
      ALTER TABLE indicacoes
      ${columnsToRemove.join(',\n      ')}
    `);
    console.log(`Removed ${columnsToRemove.length} columns from indicacoes table`);
  }
  
  console.log('Cliente data columns and indexes removed successfully!');
}

module.exports = { up, down };
