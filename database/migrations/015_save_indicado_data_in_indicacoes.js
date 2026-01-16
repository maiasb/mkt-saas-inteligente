const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Restructuring indicacoes table: saving indicado data instead of indicador data...');
  
  // 1. Adicionar colunas de dados do indicado
  console.log('Adding indicado data columns...');
  
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM indicacoes
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToAdd = [];
  
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
  
  if (columnsToAdd.length > 0) {
    await connection.execute(`
      ALTER TABLE indicacoes
      ${columnsToAdd.join(',\n      ')}
    `);
    console.log(`Added ${columnsToAdd.length} indicado columns`);
  }
  
  // 2. Remover colunas de dados do indicador
  console.log('Removing indicador data columns...');
  
  const [updatedColumns] = await connection.execute(`
    SHOW COLUMNS FROM indicacoes
  `);
  
  const updatedColumnNames = updatedColumns.map((col) => col.Field);
  const columnsToRemove = [];
  
  if (updatedColumnNames.includes('indicador_nome')) {
    columnsToRemove.push('DROP COLUMN indicador_nome');
  }
  if (updatedColumnNames.includes('indicador_email')) {
    columnsToRemove.push('DROP COLUMN indicador_email');
  }
  if (updatedColumnNames.includes('indicador_telefone')) {
    columnsToRemove.push('DROP COLUMN indicador_telefone');
  }
  if (updatedColumnNames.includes('indicador_cpf')) {
    columnsToRemove.push('DROP COLUMN indicador_cpf');
  }
  if (updatedColumnNames.includes('indicador_status')) {
    columnsToRemove.push('DROP COLUMN indicador_status');
  }
  if (updatedColumnNames.includes('indicador_associado_status')) {
    columnsToRemove.push('DROP COLUMN indicador_associado_status');
  }
  
  if (columnsToRemove.length > 0) {
    await connection.execute(`
      ALTER TABLE indicacoes
      ${columnsToRemove.join(',\n      ')}
    `);
    console.log(`Removed ${columnsToRemove.length} indicador columns`);
  }
  
  // 3. Remover índices do indicador e adicionar do indicado
  console.log('Managing indexes...');
  
  const [indexes] = await connection.execute(`
    SHOW INDEX FROM indicacoes WHERE Key_name IN ('idx_indicador_cpf', 'idx_indicador_email', 'idx_indicado_cpf', 'idx_indicado_email')
  `);
  
  const indexNames = [...new Set(indexes.map((idx) => idx.Key_name))];
  
  if (indexNames.includes('idx_indicador_cpf')) {
    await connection.execute(`DROP INDEX idx_indicador_cpf ON indicacoes`);
    console.log('Dropped index idx_indicador_cpf');
  }
  
  if (indexNames.includes('idx_indicador_email')) {
    await connection.execute(`DROP INDEX idx_indicador_email ON indicacoes`);
    console.log('Dropped index idx_indicador_email');
  }
  
  if (!indexNames.includes('idx_indicado_cpf')) {
    await connection.execute(`CREATE INDEX idx_indicado_cpf ON indicacoes(indicado_cpf)`);
    console.log('Created index idx_indicado_cpf');
  }
  
  if (!indexNames.includes('idx_indicado_email')) {
    await connection.execute(`CREATE INDEX idx_indicado_email ON indicacoes(indicado_email)`);
    console.log('Created index idx_indicado_email');
  }
  
  console.log('✅ Indicacoes table restructured: now stores indicado data + indicador_id reference');
}

async function down(connection) {
  console.log('Reverting: moving back to indicador data storage...');
  
  // Re-adicionar colunas do indicador
  await connection.execute(`
    ALTER TABLE indicacoes
    ADD COLUMN indicador_nome VARCHAR(255) NULL,
    ADD COLUMN indicador_email VARCHAR(255) NULL,
    ADD COLUMN indicador_telefone VARCHAR(20) NULL,
    ADD COLUMN indicador_cpf VARCHAR(20) NULL,
    ADD COLUMN indicador_status VARCHAR(50) NULL,
    ADD COLUMN indicador_associado_status VARCHAR(50) NULL
  `);
  
  // Remover colunas do indicado
  await connection.execute(`
    ALTER TABLE indicacoes
    DROP COLUMN indicado_nome,
    DROP COLUMN indicado_email,
    DROP COLUMN indicado_telefone,
    DROP COLUMN indicado_cpf
  `);
  
  // Gerenciar índices
  await connection.execute(`DROP INDEX idx_indicado_cpf ON indicacoes`);
  await connection.execute(`DROP INDEX idx_indicado_email ON indicacoes`);
  await connection.execute(`CREATE INDEX idx_indicador_cpf ON indicacoes(indicador_cpf)`);
  await connection.execute(`CREATE INDEX idx_indicador_email ON indicacoes(indicador_email)`);
  
  console.log('Revert completed');
}

module.exports = { up, down };
