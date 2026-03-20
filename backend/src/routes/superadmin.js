const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool   = require('../db/pool');
const { superAdminMiddleware } = require('../middleware/auth');

// ── GET /api/superadmin/empresas
router.get('/empresas', superAdminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM clientes c WHERE c.empresa_id=e.id) AS total_clientes,
        (SELECT COUNT(*) FROM emprestimos em WHERE em.empresa_id=e.id) AS total_emprestimos,
        (SELECT COALESCE(SUM(valor),0) FROM emprestimos em WHERE em.empresa_id=e.id) AS volume_total
      FROM empresas e ORDER BY e.criado_em DESC
    `);
    return res.json(rows);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro.' }); }
});

// ── POST /api/superadmin/empresas
router.post('/empresas', superAdminMiddleware, async (req, res) => {
  const { nome, slug, cnpj, telefone, email, n8n_webhook, admin_login, admin_senha, admin_nome } = req.body;
  if (!nome||!slug||!admin_login||!admin_senha)
    return res.status(400).json({ error:'Nome, slug, login e senha do admin são obrigatórios.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: emp } = await client.query(
      'INSERT INTO empresas (nome,slug,cnpj,telefone,email,n8n_webhook) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [nome, slug.toLowerCase(), cnpj||null, telefone||null, email||null, n8n_webhook||null]
    );
    const hash = await bcrypt.hash(admin_senha, 10);
    await client.query(
      'INSERT INTO administradores (empresa_id,nome,login,senha_hash) VALUES ($1,$2,$3,$4)',
      [emp[0].id, admin_nome||nome, admin_login, hash]
    );
    await client.query('COMMIT');
    return res.status(201).json(emp[0]);
  } catch(e){
    await client.query('ROLLBACK');
    if (e.code==='23505') return res.status(409).json({ error:'Slug já em uso.' });
    console.error(e); return res.status(500).json({ error:'Erro ao criar empresa.' });
  } finally { client.release(); }
});

// ── PATCH /api/superadmin/empresas/:id
router.patch('/empresas/:id', superAdminMiddleware, async (req, res) => {
  const { nome, email, telefone, n8n_webhook, ativo, plano } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE empresas SET nome=COALESCE($1,nome), email=COALESCE($2,email),
        telefone=COALESCE($3,telefone), n8n_webhook=COALESCE($4,n8n_webhook),
        ativo=COALESCE($5,ativo), plano=COALESCE($6,plano), atualizado_em=NOW()
      WHERE id=$7 RETURNING *
    `, [nome,email,telefone,n8n_webhook,ativo,plano,req.params.id]);
    if (!rows.length) return res.status(404).json({ error:'Empresa não encontrada.' });
    return res.json(rows[0]);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro.' }); }
});

// ── GET /api/superadmin/stats
router.get('/stats', superAdminMiddleware, async (req, res) => {
  try {
    const [empresas, clientes, emprestimos, volume] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM empresas WHERE ativo=true'),
      pool.query('SELECT COUNT(*) FROM clientes'),
      pool.query('SELECT COUNT(*) FROM emprestimos'),
      pool.query('SELECT COALESCE(SUM(valor),0) AS total FROM emprestimos'),
    ]);
    return res.json({
      empresas:    parseInt(empresas.rows[0].count),
      clientes:    parseInt(clientes.rows[0].count),
      emprestimos: parseInt(emprestimos.rows[0].count),
      volume:      parseFloat(volume.rows[0].total),
    });
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro.' }); }
});

module.exports = router;
