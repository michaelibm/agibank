require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const pool = require('./db/pool');

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
