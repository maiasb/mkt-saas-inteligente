async function up(connection) {
  console.log('Creating empresas table...');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS empresas (
      id VARCHAR(50) PRIMARY KEY,
      slug VARCHAR(80) NOT NULL,
      nome VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      telefone VARCHAR(30) NULL,
      cnpj VARCHAR(20) NULL,
      cor VARCHAR(9) NOT NULL DEFAULT '#6366F1',
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      regras JSON NOT NULL COMMENT 'Regras de negócio da empresa (pontos, recompensa, limite)',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.execute(
    `INSERT IGNORE INTO empresas (id, slug, nome, email, telefone, cnpj, cor, ativo, regras)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'empresa-exemplo-001',
      'empresa-exemplo',
      'Empresa Exemplo',
      'contato@empresa-exemplo.com.br',
      '(00) 0000-0000',
      '00.000.000/0001-00',
      '#0EA5E9',
      JSON.stringify({
        pontos_indicador: 10,
        pontos_indicado: 5,
        valor_conversao: 50,
        limite_indicacoes: 10,
      }),
    ]
  );

  // Clientes cadastrados manualmente ainda não possuem link
  await connection.execute('ALTER TABLE indicacoes MODIFY COLUMN link_id VARCHAR(36) NULL');

  console.log('Empresas table created!');
}

async function down(connection) {
  await connection.execute('DROP TABLE IF EXISTS empresas');
}

module.exports = { up, down };
