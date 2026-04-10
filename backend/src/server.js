require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const pool = require('./db/pool');

// ── Jobs agendados
require('./jobs/avisoVencimento');

// ── Auto-migrate: garante tabelas novas em bancos existentes
pool.query(`
  CREATE TABLE IF NOT EXISTS caixa_transacoes (
    id          SERIAL PRIMARY KEY,
    empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    admin_id    INTEGER REFERENCES administradores(id),
    tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('deposito','saque','emprestimo','pagamento')),
    valor       NUMERIC(12,2) NOT NULL,
    descricao   TEXT,
    criado_em   TIMESTAMP DEFAULT NOW()
  )
`).then(() => console.log('[db] caixa_transacoes OK'))
  .catch(e  => console.error('[db] migrate error:', e.message));

pool.query(`
  ALTER TABLE emprestimos
    ADD COLUMN IF NOT EXISTS termo_texto    TEXT,
    ADD COLUMN IF NOT EXISTS termo_aceito_em TIMESTAMP
`).then(() => console.log('[db] emprestimos termo OK'))
  .catch(e  => console.error('[db] migrate termo error:', e.message));

pool.query(`
  ALTER TABLE pre_cadastros
    ADD COLUMN IF NOT EXISTS limite_credito NUMERIC(12,2) DEFAULT 0
`).then(() => console.log('[db] pre_cadastros limite OK'))
  .catch(e  => console.error('[db] migrate limite error:', e.message));

pool.query(`
  ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS pode_pagar_juros BOOLEAN DEFAULT false
`).then(() => console.log('[db] clientes pode_pagar_juros OK'))
  .catch(e  => console.error('[db] migrate pode_pagar_juros error:', e.message));

pool.query(`
  ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS limite_credito NUMERIC(12,2) DEFAULT 0
`).then(() => console.log('[db] clientes limite_credito OK'))
  .catch(e  => console.error('[db] migrate clientes limite error:', e.message));

pool.query(`
  ALTER TABLE caixa_transacoes
    ADD COLUMN IF NOT EXISTS cancelado BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ref_tipo  TEXT
`).then(() => console.log('[db] caixa cancelamento cols OK'))
  .catch(e  => console.error('[db] migrate caixa cancelamento error:', e.message));

pool.query(`
  DO $$ BEGIN
    ALTER TABLE caixa_transacoes DROP CONSTRAINT IF EXISTS caixa_transacoes_tipo_check;
    EXCEPTION WHEN undefined_object THEN NULL;
  END $$
`).catch(() => {});
pool.query(`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'caixa_tipo_check_v2'
    ) THEN
      ALTER TABLE caixa_transacoes
        ADD CONSTRAINT caixa_tipo_check_v2
        CHECK (tipo IN ('deposito','saque','emprestimo','pagamento','cancelamento'));
    END IF;
  END $$
`).then(() => console.log('[db] caixa tipo check OK'))
  .catch(e  => console.error('[db] caixa tipo check error:', e.message));

const authRoutes        = require('./routes/auth');
const emprestimosRoutes = require('./routes/emprestimos');
const adminRoutes       = require('./routes/admin');
const superAdminRoutes  = require('./routes/superadmin');

const app = express();

// ── Middlewares globais
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE'] }));
app.use(express.json());
app.use(morgan('dev'));

// ── Rate limit
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Muitas tentativas. Aguarde.' } }));

// ── Rotas
app.use('/api/auth',        authRoutes);
app.use('/api/emprestimos', emprestimosRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/superadmin',  superAdminRoutes);

// ── Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// ── Erro global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦅 AGIBANK Backend rodando na porta ${PORT}`);
});
