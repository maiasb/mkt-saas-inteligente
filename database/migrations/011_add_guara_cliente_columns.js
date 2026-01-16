const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding Guará cliente columns to links table...');
  
  // Verificar quais colunas já existem
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM links
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToAdd = [];
  
  // Colunas de dados do cliente do Guará
  if (!columnNames.includes('cliente_nome')) {
    columnsToAdd.push("ADD COLUMN cliente_nome VARCHAR(255) NULL COMMENT 'Nome do cliente da API do Guará'");
  }
  if (!columnNames.includes('cliente_email')) {
    columnsToAdd.push("ADD COLUMN cliente_email VARCHAR(255) NULL COMMENT 'Email do cliente da API do Guará'");
  }
  if (!columnNames.includes('cliente_telefone')) {
    columnsToAdd.push("ADD COLUMN cliente_telefone VARCHAR(20) NULL COMMENT 'Telefone do cliente da API do Guará'");
  }
  if (!columnNames.includes('cliente_cpf')) {
    columnsToAdd.push("ADD COLUMN cliente_cpf VARCHAR(20) NULL COMMENT 'CPF/CNPJ do cliente da API do Guará'");
  }
  if (!columnNames.includes('cliente_status')) {
    columnsToAdd.push("ADD COLUMN cliente_status VARCHAR(50) NULL COMMENT 'Status do cliente na API do Guará'");
  }
  if (!columnNames.includes('cliente_associado_status')) {
    columnsToAdd.push("ADD COLUMN cliente_associado_status VARCHAR(50) NULL COMMENT 'Status de associado do cliente na API do Guará'");
  }
  
  // Adicionar colunas se necessário
  if (columnsToAdd.length > 0) {
    await connection.execute(`
      ALTER TABLE links
      ${columnsToAdd.join(',\n      ')}
    `);
    console.log(`Added ${columnsToAdd.length} columns to links table`);
  } else {
    console.log('All columns already exist in links table');
  }
  
  // Verificar novamente as colunas após adição
  const [updatedColumns] = await connection.execute(`
    SHOW COLUMNS FROM links
  `);
  
  const updatedColumnNames = updatedColumns.map((col) => col.Field);
  
  // Adicionar índices para melhorar performance nas buscas (apenas se colunas existirem)
  const [indexes] = await connection.execute(`
    SHOW INDEX FROM links WHERE Key_name IN ('idx_cliente_cpf', 'idx_cliente_email', 'idx_empresa_cliente')
  `);
  
  const indexNames = [...new Set(indexes.map((idx) => idx.Key_name))];
  
  if (!indexNames.includes('idx_cliente_cpf') && updatedColumnNames.includes('cliente_cpf')) {
    await connection.execute(`
      CREATE INDEX idx_cliente_cpf ON links(cliente_cpf)
    `);
    console.log('Created index idx_cliente_cpf');
  }
  
  if (!indexNames.includes('idx_cliente_email') && updatedColumnNames.includes('cliente_email')) {
    await connection.execute(`
      CREATE INDEX idx_cliente_email ON links(cliente_email)
    `);
    console.log('Created index idx_cliente_email');
  }
  
  if (!indexNames.includes('idx_empresa_cliente') && updatedColumnNames.includes('empresa_id') && updatedColumnNames.includes('cliente_id')) {
    await connection.execute(`
      CREATE INDEX idx_empresa_cliente ON links(empresa_id, cliente_id)
    `);
    console.log('Created composite index idx_empresa_cliente');
  }
  
  console.log('Guará cliente columns and indexes added successfully!');
}

async function down(connection) {
  console.log('Removing Guará cliente columns from links table...');
  
  // Remover índices
  const [indexes] = await connection.execute(`
    SHOW INDEX FROM links WHERE Key_name IN ('idx_cliente_cpf', 'idx_cliente_email', 'idx_empresa_cliente')
  `);
  
  const indexNames = [...new Set(indexes.map((idx) => idx.Key_name))];
  
  for (const indexName of indexNames) {
    await connection.execute(`
      DROP INDEX ${indexName} ON links
    `);
    console.log(`Dropped index ${indexName}`);
  }
  
  // Remover colunas
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM links
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToRemove = [];
  
  if (columnNames.includes('cliente_telefone')) {
    columnsToRemove.push('DROP COLUMN cliente_telefone');
  }
  if (columnNames.includes('cliente_cpf')) {
    columnsToRemove.push('DROP COLUMN cliente_cpf');
  }
  if (columnNames.includes('cliente_status')) {
    columnsToRemove.push('DROP COLUMN cliente_status');
  }
  if (columnNames.includes('cliente_associado_status')) {
    columnsToRemove.push('DROP COLUMN cliente_associado_status');
  }
  
  if (columnsToRemove.length > 0) {
    await connection.execute(`
      ALTER TABLE links
      ${columnsToRemove.join(',\n      ')}
    `);
    console.log(`Removed ${columnsToRemove.length} columns from links table`);
  }
  
  console.log('Guará cliente columns and indexes removed successfully!');
}

module.exports = { up, down };
