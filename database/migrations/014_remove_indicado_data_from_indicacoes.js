const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Removing indicado data columns from indicacoes table...');
  
  // Verificar quais colunas existem
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM indicacoes
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToRemove = [];
  
  // Remover colunas de dados do indicado
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
    console.log(`Removed ${columnsToRemove.length} indicado columns from indicacoes table`);
  }
  
  // Remover índices relacionados
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
  
  console.log('✅ Indicado data columns removed - indicacoes table now stores only indicador data');
  console.log('   Indicado data will be managed separately, enabling scalability');
}

async function down(connection) {
  console.log('Re-adding indicado data columns to indicacoes table...');
  
  await connection.execute(`
    ALTER TABLE indicacoes
    ADD COLUMN indicado_nome VARCHAR(255) NULL COMMENT 'Nome do cliente indicado',
    ADD COLUMN indicado_email VARCHAR(255) NULL COMMENT 'Email do cliente indicado',
    ADD COLUMN indicado_telefone VARCHAR(20) NULL COMMENT 'Telefone do cliente indicado',
    ADD COLUMN indicado_cpf VARCHAR(20) NULL COMMENT 'CPF/CNPJ do cliente indicado'
  `);
  
  await connection.execute(`CREATE INDEX idx_indicado_cpf ON indicacoes(indicado_cpf)`);
  await connection.execute(`CREATE INDEX idx_indicado_email ON indicacoes(indicado_email)`);
  
  console.log('Indicado data columns restored');
}

module.exports = { up, down };
