/**
 * Migration 016: Remove dados do indicado da tabela indicacoes
 * 
 * ANTES: indicacoes tinha indicado_nome, indicado_email, indicado_telefone, indicado_cpf
 * DEPOIS: indicacoes tem apenas indicador_id e indicado_id (referências)
 * 
 * Tabela final: id, empresa_id, indicador_id, indicado_id, link_id, created_at
 */

export async function up(db) {
  console.log('Removendo colunas de dados do indicado...');
  
  // Remove índices das colunas que serão deletadas
  await db.query(`
    ALTER TABLE indicacoes DROP INDEX idx_indicado_cpf
  `);
  console.log('✓ Índice idx_indicado_cpf removido');
  
  await db.query(`
    ALTER TABLE indicacoes DROP INDEX idx_indicado_email
  `);
  console.log('✓ Índice idx_indicado_email removido');
  
  // Remove colunas de dados do indicado
  await db.query(`
    ALTER TABLE indicacoes
    DROP COLUMN indicado_nome,
    DROP COLUMN indicado_email,
    DROP COLUMN indicado_telefone,
    DROP COLUMN indicado_cpf
  `);
  console.log('✓ Colunas indicado_nome, indicado_email, indicado_telefone, indicado_cpf removidas');
  
  console.log('✅ Tabela indicacoes agora contém apenas IDs (indicador_id e indicado_id)');
}

export async function down(db) {
  console.log('Revertendo remoção de dados do indicado...');
  
  // Adiciona colunas de volta
  await db.query(`
    ALTER TABLE indicacoes
    ADD COLUMN indicado_nome VARCHAR(255) NULL,
    ADD COLUMN indicado_email VARCHAR(255) NULL,
    ADD COLUMN indicado_telefone VARCHAR(20) NULL,
    ADD COLUMN indicado_cpf VARCHAR(14) NULL
  `);
  console.log('✓ Colunas indicado_* adicionadas de volta');
  
  // Recria índices
  await db.query(`
    CREATE INDEX idx_indicado_cpf ON indicacoes(indicado_cpf)
  `);
  
  await db.query(`
    CREATE INDEX idx_indicado_email ON indicacoes(indicado_email)
  `);
  console.log('✓ Índices recriados');
  
  console.log('✅ Revertido para estrutura anterior');
}
