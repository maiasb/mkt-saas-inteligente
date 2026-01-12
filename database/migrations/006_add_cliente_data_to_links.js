const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding cliente data columns to links table...');
  
  // Verificar quais colunas já existem
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM links
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToAdd = [];
  
  if (!columnNames.includes('cliente_nome')) {
    columnsToAdd.push("ADD COLUMN cliente_nome VARCHAR(255) NULL COMMENT 'Nome do cliente da API externa'");
  }
  if (!columnNames.includes('cliente_email')) {
    columnsToAdd.push("ADD COLUMN cliente_email VARCHAR(255) NULL COMMENT 'Email do cliente da API externa'");
  }
  
  // Adicionar colunas se necessário
  if (columnsToAdd.length > 0) {
    await connection.execute(`
      ALTER TABLE links
      ${columnsToAdd.join(',\n      ')}
    `);
  }
  
  console.log('Cliente data columns added to links table successfully!');
}

async function down(connection) {
  console.log('Removing cliente data columns from links table...');
  
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
  
  console.log('Cliente data columns removed from links table successfully!');
}

module.exports = { up, down };
