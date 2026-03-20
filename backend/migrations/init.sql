-- ═══════════════════════════════════════════════════════════
-- AGIBANK — Schema Multi-Tenant
-- ═══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- SUPER ADMIN (dono da plataforma)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  login       VARCHAR(100) UNIQUE NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- EMPRESAS / TENANTS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,
  slug          VARCHAR(80)  UNIQUE NOT NULL,  -- identificador url-friendly
  cnpj          VARCHAR(20),
  telefone      VARCHAR(20),
  email         VARCHAR(150),
  logo_url      VARCHAR(300),
  cor_primaria  VARCHAR(20)  DEFAULT '#E91E8C',
  plano         VARCHAR(30)  DEFAULT 'basico',  -- basico | pro | enterprise
  ativo         BOOLEAN      DEFAULT TRUE,
  n8n_webhook   VARCHAR(300),
  criado_em     TIMESTAMP    DEFAULT NOW(),
  atualizado_em TIMESTAMP    DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- ADMINISTRADORES DE EMPRESA
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS administradores (
  id          SERIAL PRIMARY KEY,
  empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        VARCHAR(150) NOT NULL,
  login       VARCHAR(100) NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMP DEFAULT NOW(),
  UNIQUE(empresa_id, login)
);

-- ───────────────────────────────────────────────────────────
-- PRÉ-CADASTROS (por empresa)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pre_cadastros (
  id          SERIAL PRIMARY KEY,
  empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  telefone    VARCHAR(20) NOT NULL,
  nome        VARCHAR(150) NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMP DEFAULT NOW(),
  UNIQUE(empresa_id, telefone)
);

-- ───────────────────────────────────────────────────────────
-- CLIENTES (por empresa) — login por CPF
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id            SERIAL PRIMARY KEY,
  empresa_id    INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          VARCHAR(150) NOT NULL,
  cpf           VARCHAR(14)  NOT NULL,
  rg            VARCHAR(30)  NOT NULL,
  email         VARCHAR(150) NOT NULL,
  telefone      VARCHAR(20)  NOT NULL,
  cep           VARCHAR(10),
  rua           VARCHAR(200),
  numero        VARCHAR(20),
  bairro        VARCHAR(100),
  cidade        VARCHAR(100),
  estado        VARCHAR(2),
  pix_tipo      VARCHAR(30),
  pix_chave     VARCHAR(200),
  senha_hash    VARCHAR(255) NOT NULL,
  lgpd_aceito   BOOLEAN      DEFAULT FALSE,
  lgpd_data     TIMESTAMP,
  ativo         BOOLEAN      DEFAULT TRUE,
  criado_em     TIMESTAMP    DEFAULT NOW(),
  atualizado_em TIMESTAMP    DEFAULT NOW(),
  UNIQUE(empresa_id, cpf),
  UNIQUE(empresa_id, email),
  UNIQUE(empresa_id, telefone)
);

-- ───────────────────────────────────────────────────────────
-- EMPRÉSTIMOS (por empresa)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emprestimos (
  id               SERIAL PRIMARY KEY,
  empresa_id       INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id       INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  valor            NUMERIC(12,2) NOT NULL,
  valor_com_juros  NUMERIC(12,2) NOT NULL,
  percentual_juros NUMERIC(5,2)  DEFAULT 30.00,
  status           VARCHAR(30)   DEFAULT 'em_analise'
                   CHECK (status IN ('em_analise','aprovado','reprovado','pago','vencido')),
  data_solicitacao TIMESTAMP     DEFAULT NOW(),
  data_aprovacao   TIMESTAMP,
  data_vencimento  TIMESTAMP,
  data_pagamento   TIMESTAMP,
  admin_id         INTEGER REFERENCES administradores(id),
  observacao       TEXT,
  criado_em        TIMESTAMP     DEFAULT NOW(),
  atualizado_em    TIMESTAMP     DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- CAIXA — Controle financeiro por empresa
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caixa_transacoes (
  id          SERIAL PRIMARY KEY,
  empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  admin_id    INTEGER REFERENCES administradores(id),
  tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('deposito','saque','emprestimo','pagamento')),
  valor       NUMERIC(12,2) NOT NULL,
  descricao   TEXT,
  criado_em   TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- ÍNDICES
-- ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_empresa    ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf        ON clientes(empresa_id, cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone   ON clientes(empresa_id, telefone);
CREATE INDEX IF NOT EXISTS idx_emprestimos_empresa ON emprestimos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_cliente ON emprestimos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_status  ON emprestimos(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_pre_empresa         ON pre_cadastros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_admin_empresa       ON administradores(empresa_id);

-- ───────────────────────────────────────────────────────────
-- DADOS INICIAIS
-- ───────────────────────────────────────────────────────────

-- Super Admin (senha: superadmin123)
INSERT INTO super_admins (nome, login, senha_hash) VALUES
  ('Super Administrador', 'superadmin', '$2b$10$qchMLtO/t2jWhWMkijcvRujW9fxDRdmrzME7vsrhUmZlaAvKNq0A6')
ON CONFLICT DO NOTHING;

-- Empresa demo
INSERT INTO empresas (nome, slug, email, n8n_webhook) VALUES
  ('AGIBANK Demo', 'agibank', 'admin@agibank.com', 'https://n8n.1rimanausti.com.br/webhook-test/agibank')
ON CONFLICT DO NOTHING;

-- Admin da empresa demo (senha: admin123)
INSERT INTO administradores (empresa_id, nome, login, senha_hash)
SELECT e.id, 'Administrador', 'admin', '$2b$10$q7SJ3mogXRUwHKn3ErhUuepEk6zjeRKHBpbkUGf2bcWdo1lgVPt1u'
FROM empresas e WHERE e.slug='agibank'
ON CONFLICT DO NOTHING;

-- Pré-cadastros demo
INSERT INTO pre_cadastros (empresa_id, telefone, nome)
SELECT e.id, t.telefone, t.nome FROM empresas e,
  (VALUES
    ('92991234567','Ana Souza'),
    ('92998765432','Carlos Lima'),
    ('92994561230','Fernanda Costa'),
    ('92993214567','Roberto Alves')
  ) AS t(telefone, nome)
WHERE e.slug='agibank'
ON CONFLICT DO NOTHING;
