const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding usuario_indicado_id to clientes table...');
  
  // Adicionar coluna para rastrear se um cliente veio de uma indicação
  await connection.execute(`
    ALTER TABLE clientes
    ADD COLUMN usuario_indicado_id VARCHAR(36) NULL,
    ADD INDEX idx_usuario_indicado_id (usuario_indicado_id),
    ADD FOREIGN KEY (usuario_indicado_id) REFERENCES usuarios_indicados(id) ON DELETE SET NULL
  `);
  
  console.log('Adding nivel_indicacao to usuarios_indicados table...');
  
  // Adicionar coluna para rastrear o nível na árvore de indicações
  await connection.execute(`
    ALTER TABLE usuarios_indicados
    ADD COLUMN nivel_indicacao INT DEFAULT 1,
    ADD COLUMN indicador_origem_id VARCHAR(36) NULL COMMENT 'ID do cliente que indicou este usuário',
    ADD INDEX idx_nivel_indicacao (nivel_indicacao),
    ADD INDEX idx_indicador_origem (indicador_origem_id)
  `);
}

async function down(connection) {
  console.log('Removing usuario_indicado_id from clientes table...');
  await connection.execute(`
    ALTER TABLE clientes
    DROP FOREIGN KEY clientes_ibfk_2,
    DROP INDEX idx_usuario_indicado_id,
    DROP COLUMN usuario_indicado_id
  `);
  
  console.log('Removing nivel_indicacao from usuarios_indicados table...');
  await connection.execute(`
    ALTER TABLE usuarios_indicados
    DROP INDEX idx_nivel_indicacao,
    DROP INDEX idx_indicador_origem,
    DROP COLUMN nivel_indicacao,
    DROP COLUMN indicador_origem_id
  `);
}

module.exports = { up, down };
