/**
 * Migration 017: Adiciona dados do cliente na tabela indicacoes
 * 
 * NOVA LÓGICA:
 * - indicacoes contém TODOS os clientes (indicadores + indicados)
 * - Se indicador_id = NULL -> cliente é apenas indicador
 * - Se indicador_id preenchido -> cliente foi indicado por alguém
 * - cliente_id: ID do cliente na API externa (Guará)
 * - Dados: nome, email, telefone, cpf salvos localmente
 */

export async function up(db) {
  console.log('Adicionando colunas de dados do cliente...');
  
  // Torna indicador_id nullable
  await db.query(`
    ALTER TABLE indicacoes
    MODIFY COLUMN indicador_id VARCHAR(255) NULL
  `);
  console.log('✓ indicador_id agora é nullable');
  
  // Remove indicado_id (não precisamos mais)
  await db.query(`
    ALTER TABLE indicacoes
    DROP COLUMN indicado_id
  `);
  console.log('✓ Coluna indicado_id removida');
  
  // Adiciona cliente_id
  await db.query(`
    ALTER TABLE indicacoes
    ADD COLUMN cliente_id VARCHAR(255) NOT NULL AFTER empresa_id
  `);
  console.log('✓ Coluna cliente_id adicionada');
  
  // Adiciona dados do cliente
  await db.query(`
    ALTER TABLE indicacoes
    ADD COLUMN nome VARCHAR(255) NOT NULL AFTER link_id,
    ADD COLUMN email VARCHAR(255) NULL,
    ADD COLUMN telefone VARCHAR(20) NULL,
    ADD COLUMN cpf VARCHAR(14) NULL
  `);
  console.log('✓ Colunas nome, email, telefone, cpf adicionadas');
  
  // Cria índices
  await db.query(`
    CREATE INDEX idx_cliente_id ON indicacoes(cliente_id)
  `);
  
  await db.query(`
    CREATE INDEX idx_cpf ON indicacoes(cpf)
  `);
  
  await db.query(`
    CREATE INDEX idx_email ON indicacoes(email)
  `);
  console.log('✓ Índices criados');
  
  console.log('✅ Tabela indicacoes reestruturada:');
  console.log('   - Todos os clientes do programa (indicadores + indicados)');
  console.log('   - indicador_id NULL = apenas indicador');
  console.log('   - indicador_id preenchido = foi indicado');
}

export async function down(db) {
  console.log('Revertendo alterações...');
  
  // Remove índices
  await db.query(`ALTER TABLE indicacoes DROP INDEX idx_cliente_id`);
  await db.query(`ALTER TABLE indicacoes DROP INDEX idx_cpf`);
  await db.query(`ALTER TABLE indicacoes DROP INDEX idx_email`);
  
  // Remove colunas
  await db.query(`
    ALTER TABLE indicacoes
    DROP COLUMN cliente_id,
    DROP COLUMN nome,
    DROP COLUMN email,
    DROP COLUMN telefone,
    DROP COLUMN cpf
  `);
  
  // Adiciona indicado_id de volta
  await db.query(`
    ALTER TABLE indicacoes
    ADD COLUMN indicado_id VARCHAR(255) NOT NULL AFTER indicador_id
  `);
  
  // Torna indicador_id NOT NULL
  await db.query(`
    ALTER TABLE indicacoes
    MODIFY COLUMN indicador_id VARCHAR(255) NOT NULL
  `);
  
  console.log('✅ Revertido');
}
