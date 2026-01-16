const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Moving cliente data from links to indicacoes and restructuring...');
  
  // 1. Adicionar colunas de dados do indicador na tabela indicacoes
  console.log('Adding indicador data columns to indicacoes table...');
  
  const [indicacoesColumns] = await connection.execute(`
    SHOW COLUMNS FROM indicacoes
  `);
  
  const indicacoesColumnNames = indicacoesColumns.map((col) => col.Field);
  const indicacoesColumnsToAdd = [];
  
  if (!indicacoesColumnNames.includes('indicador_nome')) {
    indicacoesColumnsToAdd.push("ADD COLUMN indicador_nome VARCHAR(255) NULL COMMENT 'Nome do indicador'");
  }
  if (!indicacoesColumnNames.includes('indicador_email')) {
    indicacoesColumnsToAdd.push("ADD COLUMN indicador_email VARCHAR(255) NULL COMMENT 'Email do indicador'");
  }
  if (!indicacoesColumnNames.includes('indicador_telefone')) {
    indicacoesColumnsToAdd.push("ADD COLUMN indicador_telefone VARCHAR(20) NULL COMMENT 'Telefone do indicador'");
  }
  if (!indicacoesColumnNames.includes('indicador_cpf')) {
    indicacoesColumnsToAdd.push("ADD COLUMN indicador_cpf VARCHAR(20) NULL COMMENT 'CPF/CNPJ do indicador'");
  }
  if (!indicacoesColumnNames.includes('indicador_status')) {
    indicacoesColumnsToAdd.push("ADD COLUMN indicador_status VARCHAR(50) NULL COMMENT 'Status do indicador'");
  }
  if (!indicacoesColumnNames.includes('indicador_associado_status')) {
    indicacoesColumnsToAdd.push("ADD COLUMN indicador_associado_status VARCHAR(50) NULL COMMENT 'Status de associado do indicador'");
  }
  
  if (indicacoesColumnsToAdd.length > 0) {
    await connection.execute(`
      ALTER TABLE indicacoes
      ${indicacoesColumnsToAdd.join(',\n      ')}
    `);
    console.log(`Added ${indicacoesColumnsToAdd.length} indicador columns to indicacoes table`);
  }
  
  // 2. Migrar dados existentes de links para indicacoes (se houver)
  console.log('Migrating existing data from links to indicacoes...');
  
  await connection.execute(`
    UPDATE indicacoes i
    INNER JOIN links l ON i.indicador_id = l.cliente_id AND i.empresa_id = l.empresa_id
    SET 
      i.indicador_nome = l.cliente_nome,
      i.indicador_email = l.cliente_email,
      i.indicador_telefone = l.cliente_telefone,
      i.indicador_cpf = l.cliente_cpf,
      i.indicador_status = l.cliente_status,
      i.indicador_associado_status = l.cliente_associado_status
    WHERE l.cliente_nome IS NOT NULL
  `);
  
  console.log('Data migrated from links to indicacoes');
  
  // 3. Remover colunas de dados do cliente da tabela links
  console.log('Removing cliente data columns from links table...');
  
  const [linksColumns] = await connection.execute(`
    SHOW COLUMNS FROM links
  `);
  
  const linksColumnNames = linksColumns.map((col) => col.Field);
  const linksColumnsToRemove = [];
  
  if (linksColumnNames.includes('cliente_nome')) {
    linksColumnsToRemove.push('DROP COLUMN cliente_nome');
  }
  if (linksColumnNames.includes('cliente_email')) {
    linksColumnsToRemove.push('DROP COLUMN cliente_email');
  }
  if (linksColumnNames.includes('cliente_telefone')) {
    linksColumnsToRemove.push('DROP COLUMN cliente_telefone');
  }
  if (linksColumnNames.includes('cliente_cpf')) {
    linksColumnsToRemove.push('DROP COLUMN cliente_cpf');
  }
  if (linksColumnNames.includes('cliente_status')) {
    linksColumnsToRemove.push('DROP COLUMN cliente_status');
  }
  if (linksColumnNames.includes('cliente_associado_status')) {
    linksColumnsToRemove.push('DROP COLUMN cliente_associado_status');
  }
  
  if (linksColumnsToRemove.length > 0) {
    await connection.execute(`
      ALTER TABLE links
      ${linksColumnsToRemove.join(',\n      ')}
    `);
    console.log(`Removed ${linksColumnsToRemove.length} columns from links table`);
  }
  
  // 4. Remover índices relacionados a colunas removidas
  console.log('Removing indexes from links table...');
  
  const [linksIndexes] = await connection.execute(`
    SHOW INDEX FROM links WHERE Key_name IN ('idx_cliente_cpf', 'idx_cliente_email')
  `);
  
  const linksIndexNames = [...new Set(linksIndexes.map((idx) => idx.Key_name))];
  
  for (const indexName of linksIndexNames) {
    await connection.execute(`
      DROP INDEX ${indexName} ON links
    `);
    console.log(`Dropped index ${indexName} from links`);
  }
  
  // 5. Adicionar índices para colunas do indicador
  console.log('Adding indexes to indicacoes table...');
  
  const [indicacoesIndexes] = await connection.execute(`
    SHOW INDEX FROM indicacoes WHERE Key_name IN ('idx_indicador_cpf', 'idx_indicador_email')
  `);
  
  const indicacoesIndexNames = [...new Set(indicacoesIndexes.map((idx) => idx.Key_name))];
  
  if (!indicacoesIndexNames.includes('idx_indicador_cpf')) {
    await connection.execute(`
      CREATE INDEX idx_indicador_cpf ON indicacoes(indicador_cpf)
    `);
    console.log('Created index idx_indicador_cpf');
  }
  
  if (!indicacoesIndexNames.includes('idx_indicador_email')) {
    await connection.execute(`
      CREATE INDEX idx_indicador_email ON indicacoes(indicador_email)
    `);
    console.log('Created index idx_indicador_email');
  }
  
  console.log('✅ Migration completed: Cliente data moved to indicacoes table');
}

async function down(connection) {
  console.log('Reverting: Moving cliente data back to links...');
  
  // 1. Re-adicionar colunas na tabela links
  await connection.execute(`
    ALTER TABLE links
    ADD COLUMN cliente_nome VARCHAR(255) NULL,
    ADD COLUMN cliente_email VARCHAR(255) NULL,
    ADD COLUMN cliente_telefone VARCHAR(20) NULL,
    ADD COLUMN cliente_cpf VARCHAR(20) NULL,
    ADD COLUMN cliente_status VARCHAR(50) NULL,
    ADD COLUMN cliente_associado_status VARCHAR(50) NULL
  `);
  
  // 2. Re-criar índices
  await connection.execute(`CREATE INDEX idx_cliente_cpf ON links(cliente_cpf)`);
  await connection.execute(`CREATE INDEX idx_cliente_email ON links(cliente_email)`);
  
  // 3. Migrar dados de volta
  await connection.execute(`
    UPDATE links l
    INNER JOIN indicacoes i ON l.cliente_id = i.indicador_id AND l.empresa_id = i.empresa_id
    SET 
      l.cliente_nome = i.indicador_nome,
      l.cliente_email = i.indicador_email,
      l.cliente_telefone = i.indicador_telefone,
      l.cliente_cpf = i.indicador_cpf,
      l.cliente_status = i.indicador_status,
      l.cliente_associado_status = i.indicador_associado_status
    WHERE i.indicador_nome IS NOT NULL
  `);
  
  // 4. Remover colunas do indicador de indicacoes
  await connection.execute(`
    ALTER TABLE indicacoes
    DROP COLUMN indicador_nome,
    DROP COLUMN indicador_email,
    DROP COLUMN indicador_telefone,
    DROP COLUMN indicador_cpf,
    DROP COLUMN indicador_status,
    DROP COLUMN indicador_associado_status
  `);
  
  // 5. Remover índices de indicacoes
  await connection.execute(`DROP INDEX idx_indicador_cpf ON indicacoes`);
  await connection.execute(`DROP INDEX idx_indicador_email ON indicacoes`);
  
  console.log('Revert completed');
}

module.exports = { up, down };
