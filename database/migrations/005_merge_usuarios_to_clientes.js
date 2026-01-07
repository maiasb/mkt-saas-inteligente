const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding campos de indicação to clientes table...');
  
  // Verificar quais colunas já existem antes de adicionar
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM clientes
  `);
  
  const columnNames = columns.map((col) => col.Field);
  const columnsToAdd = [];
  
  if (!columnNames.includes('cpf')) {
    columnsToAdd.push('ADD COLUMN cpf VARCHAR(50) NULL');
  }
  if (!columnNames.includes('indicador_cliente_id')) {
    columnsToAdd.push("ADD COLUMN indicador_cliente_id VARCHAR(36) NULL COMMENT 'ID do cliente que indicou'");
  }
  if (!columnNames.includes('link_id')) {
    columnsToAdd.push("ADD COLUMN link_id VARCHAR(36) NULL COMMENT 'ID do link usado'");
  }
  if (!columnNames.includes('nivel_indicacao')) {
    columnsToAdd.push('ADD COLUMN nivel_indicacao INT DEFAULT 1');
  }
  
  // Adicionar colunas se necessário
  if (columnsToAdd.length > 0) {
    await connection.execute(`
      ALTER TABLE clientes
      ${columnsToAdd.join(',\n      ')}
    `);
  }
  
  // Adicionar índices se as colunas foram criadas
  const [indexes] = await connection.execute(`
    SHOW INDEX FROM clientes
  `);
  const indexNames = indexes.map((idx) => idx.Key_name);
  
  if (!indexNames.includes('idx_indicador_cliente') && columnNames.includes('indicador_cliente_id')) {
    await connection.execute(`ALTER TABLE clientes ADD INDEX idx_indicador_cliente (indicador_cliente_id)`);
  }
  if (!indexNames.includes('idx_link_id') && columnNames.includes('link_id')) {
    await connection.execute(`ALTER TABLE clientes ADD INDEX idx_link_id (link_id)`);
  }
  if (!indexNames.includes('idx_nivel_indicacao') && columnNames.includes('nivel_indicacao')) {
    await connection.execute(`ALTER TABLE clientes ADD INDEX idx_nivel_indicacao (nivel_indicacao)`);
  }

  console.log('Migrating data from usuarios_indicados to clientes...');
  
  // Migrar dados existentes de usuarios_indicados para clientes usando UUID direto
  await connection.execute(`
    INSERT INTO clientes (id, nome, email, telefone, cpf, empresa_id, indicador_cliente_id, link_id, nivel_indicacao, created_at)
    SELECT 
      ui.id,
      ui.nome,
      ui.email,
      ui.telefone,
      ui.cpf,
      ui.empresa_id,
      ui.indicador_origem_id as indicador_cliente_id,
      ui.link_id,
      ui.nivel_indicacao,
      ui.created_at
    FROM usuarios_indicados ui
    WHERE NOT EXISTS (
      SELECT 1 FROM clientes c 
      WHERE c.email = ui.email AND c.empresa_id = ui.empresa_id
    )
  `);

  console.log('Dropping usuarios_indicados table...');
  
  // Buscar todas as foreign keys de clientes que referenciam usuarios_indicados
  const [fks] = await connection.execute(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clientes'
      AND REFERENCED_TABLE_NAME = 'usuarios_indicados'
  `);
  
  // Remover todas as foreign keys encontradas
  for (const fk of fks) {
    try {
      console.log(`Removing foreign key ${fk.CONSTRAINT_NAME}...`);
      await connection.execute(`ALTER TABLE clientes DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    } catch (e) {
      console.log(`Could not remove ${fk.CONSTRAINT_NAME}: ${e.message}`);
    }
  }
  
  // Remover coluna usuario_indicado_id se existir
  try {
    await connection.execute(`
      ALTER TABLE clientes DROP INDEX IF EXISTS idx_usuario_indicado_id
    `);
  } catch (e) {
    console.log('Index idx_usuario_indicado_id não existe');
  }
  
  try {
    await connection.execute(`
      ALTER TABLE clientes DROP COLUMN IF EXISTS usuario_indicado_id
    `);
  } catch (e) {
    console.log('Column usuario_indicado_id não existe');
  }
  
  await connection.execute(`DROP TABLE IF EXISTS usuarios_indicados`);
  
  console.log('Adding foreign keys...');
  await connection.execute(`
    ALTER TABLE clientes
    ADD FOREIGN KEY (indicador_cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    ADD FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE SET NULL
  `);
  
  console.log('Updating links table...');
  // Atualizar contagem de indicações nos links para usar apenas clientes
  await connection.execute(`
    UPDATE links l
    SET l.updated_at = CURRENT_TIMESTAMP
  `);
}

async function down(connection) {
  console.log('Recreating usuarios_indicados table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS usuarios_indicados (
      id VARCHAR(36) PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefone VARCHAR(50),
      cpf VARCHAR(50),
      link_id VARCHAR(36) NOT NULL,
      cliente_id VARCHAR(36),
      empresa_id VARCHAR(36) NOT NULL,
      nivel_indicacao INT DEFAULT 1,
      indicador_origem_id VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_link_id (link_id),
      INDEX idx_cliente_id (cliente_id),
      INDEX idx_empresa_id (empresa_id),
      INDEX idx_nivel_indicacao (nivel_indicacao),
      INDEX idx_indicador_origem (indicador_origem_id),
      FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  console.log('Removing new fields from clientes...');
  await connection.execute(`
    ALTER TABLE clientes
    DROP FOREIGN KEY IF EXISTS clientes_ibfk_3,
    DROP FOREIGN KEY IF EXISTS clientes_ibfk_4,
    DROP INDEX IF EXISTS idx_indicador_cliente,
    DROP INDEX IF EXISTS idx_link_id,
    DROP INDEX IF EXISTS idx_nivel_indicacao,
    DROP COLUMN IF EXISTS cpf,
    DROP COLUMN IF EXISTS indicador_cliente_id,
    DROP COLUMN IF EXISTS link_id,
    DROP COLUMN IF EXISTS nivel_indicacao
  `);
}

module.exports = { up, down };
