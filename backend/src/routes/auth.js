const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../db/pool');
const { generateToken } = require('../middleware/auth');

// ── POST /api/auth/verificar-telefone
// Verifica se telefone está pré-cadastrado em UMA empresa (por slug)
router.post('/verificar-telefone', async (req, res) => {
  const { telefone, empresa_slug } = req.body;
  if (!telefone || !empresa_slug)
    return res.status(400).json({ error: 'Telefone e empresa obrigatórios.' });

  const clean = telefone.replace(/\D/g, '');
  try {
    const { rows: emp } = await pool.query(
      'SELECT id FROM empresas WHERE slug=$1 AND ativo=true', [empresa_slug]
    );
    if (!emp.length) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const empresa_id = emp[0].id;

    const { rows } = await pool.query(
      'SELECT * FROM pre_cadastros WHERE telefone=$1 AND empresa_id=$2 AND ativo=true',
      [clean, empresa_id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Número não encontrado. Contate o administrador.' });

    const { rows: existente } = await pool.query(
      'SELECT id FROM clientes WHERE telefone=$1 AND empresa_id=$2', [clean, empresa_id]
    );
    if (existente.length)
      return res.status(409).json({ error: 'Número já cadastrado. Faça o login com seu CPF.' });

    return res.json({ ok: true, nome: rows[0].nome });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/auth/cadastrar
router.post('/cadastrar', async (req, res) => {
  const {
    nome, cpf, rg, email, telefone,
    cep, rua, numero, bairro, cidade, estado,
    pix_tipo, pix_chave, senha, lgpd, empresa_slug
  } = req.body;

  if (!lgpd)         return res.status(400).json({ error: 'Aceite o termo LGPD.' });
  if (!empresa_slug) return res.status(400).json({ error: 'Empresa não informada.' });

  const clean    = telefone?.replace(/\D/g, '');
  const cpfClean = cpf?.replace(/\D/g, '');

  try {
    const { rows: emp } = await pool.query(
      'SELECT id FROM empresas WHERE slug=$1 AND ativo=true', [empresa_slug]
    );
    if (!emp.length) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const empresa_id = emp[0].id;

    // Verifica pré-cadastro de telefone
    const { rows: pre } = await pool.query(
      'SELECT * FROM pre_cadastros WHERE telefone=$1 AND empresa_id=$2 AND ativo=true',
      [clean, empresa_id]
    );
    if (!pre.length) return res.status(403).json({ error: 'Telefone sem pré-cadastro.' });

    const hash = await bcrypt.hash(senha, 10);

    const { rows } = await pool.query(`
      INSERT INTO clientes
        (empresa_id,nome,cpf,rg,email,telefone,cep,rua,numero,bairro,cidade,estado,
         pix_tipo,pix_chave,senha_hash,lgpd_aceito,lgpd_data)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
      RETURNING id,nome,email,telefone,cpf,empresa_id
    `, [empresa_id, nome, cpfClean, rg, email, clean,
        cep, rua, numero, bairro, cidade, estado,
        pix_tipo, pix_chave, hash, true]);

    const token = generateToken({ id: rows[0].id, role: 'cliente', empresa_id, nome: rows[0].nome });
    return res.status(201).json({ token, cliente: rows[0] });
  } catch (e) {
    if (e.code === '23505') {
      if (e.constraint?.includes('cpf'))     return res.status(409).json({ error: 'CPF já cadastrado nesta empresa.' });
      if (e.constraint?.includes('email'))   return res.status(409).json({ error: 'E-mail já cadastrado.' });
      if (e.constraint?.includes('telefone'))return res.status(409).json({ error: 'Telefone já cadastrado.' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Erro ao cadastrar.' });
  }
});

// ── POST /api/auth/login  (cliente loga por CPF)
router.post('/login', async (req, res) => {
  const { cpf, senha, empresa_slug } = req.body;
  if (!cpf || !senha || !empresa_slug)
    return res.status(400).json({ error: 'CPF, senha e empresa obrigatórios.' });

  const cpfClean = cpf.replace(/\D/g, '');
  try {
    const { rows: emp } = await pool.query(
      'SELECT id FROM empresas WHERE slug=$1 AND ativo=true', [empresa_slug]
    );
    if (!emp.length) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const empresa_id = emp[0].id;

    const { rows } = await pool.query(
      'SELECT * FROM clientes WHERE cpf=$1 AND empresa_id=$2 AND ativo=true',
      [cpfClean, empresa_id]
    );
    if (!rows.length) return res.status(401).json({ error: 'CPF ou senha incorretos.' });

    const ok = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ error: 'CPF ou senha incorretos.' });

    const token = generateToken({ id: rows[0].id, role: 'cliente', empresa_id, nome: rows[0].nome });
    const { senha_hash, ...cliente } = rows[0];
    return res.json({ token, cliente });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/auth/admin/login  (admin de empresa)
router.post('/admin/login', async (req, res) => {
  const { login, senha, empresa_slug } = req.body;
  if (!login || !senha || !empresa_slug)
    return res.status(400).json({ error: 'Login, senha e empresa obrigatórios.' });

  try {
    const { rows: emp } = await pool.query(
      'SELECT id, nome, n8n_webhook FROM empresas WHERE slug=$1 AND ativo=true', [empresa_slug]
    );
    if (!emp.length) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const empresa = emp[0];

    const { rows } = await pool.query(
      'SELECT * FROM administradores WHERE login=$1 AND empresa_id=$2 AND ativo=true',
      [login, empresa.id]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const ok = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = generateToken({
      id: rows[0].id, role: 'admin',
      empresa_id: empresa.id, empresa_slug,
      empresa_nome: empresa.nome,
      nome: rows[0].nome
    });
    return res.json({
      token,
      admin: { id: rows[0].id, nome: rows[0].nome, login: rows[0].login },
      empresa: { id: empresa.id, nome: empresa.nome, slug: empresa_slug }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/auth/superadmin/login
router.post('/superadmin/login', async (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) return res.status(400).json({ error: 'Login e senha obrigatórios.' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM super_admins WHERE login=$1 AND ativo=true', [login]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const ok = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const token = generateToken({ id: rows[0].id, role: 'superadmin', nome: rows[0].nome });
    return res.json({ token, superadmin: { id: rows[0].id, nome: rows[0].nome } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'agibank_secret');

    if (decoded.role === 'superadmin') {
      const { rows } = await pool.query('SELECT id,nome,login FROM super_admins WHERE id=$1', [decoded.id]);
      return res.json({ role: 'superadmin', ...rows[0] });
    }
    if (decoded.role === 'admin') {
      const { rows } = await pool.query(
        `SELECT a.id,a.nome,a.login,e.nome AS empresa_nome,e.slug AS empresa_slug,e.cor_primaria,e.n8n_webhook
         FROM administradores a JOIN empresas e ON e.id=a.empresa_id WHERE a.id=$1`,
        [decoded.id]
      );
      return res.json({ role: 'admin', empresa_id: decoded.empresa_id, ...rows[0] });
    }
    // cliente
    const { rows } = await pool.query(
      `SELECT id,empresa_id,nome,cpf,rg,email,telefone,cep,rua,numero,bairro,cidade,estado,
              pix_tipo,pix_chave,lgpd_aceito,criado_em
       FROM clientes WHERE id=$1`, [decoded.id]
    );
    return res.json({ role: 'cliente', ...rows[0] });
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
});

module.exports = router;
