-- ───────────────────────────────────────────────────────────
-- CAIXA — Controle financeiro por empresa
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caixa_transacoes (
  id          SERIAL PRIMARY KEY,
  empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  admin_id    INTEGER REFERENCES administradores(id),
  tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('deposito','saque','emprestimo','pagamento')),
  valor       NUMERIC(12,2) NOT NULL,  -- sempre positivo
  descricao   TEXT,
  criado_em   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caixa_empresa ON caixa_transacoes(empresa_id);
