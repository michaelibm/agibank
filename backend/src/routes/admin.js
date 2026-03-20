const router = require('express').Router();
const pool   = require('../db/pool');
const bcrypt = require('bcryptjs');
const { adminMiddleware } = require('../middleware/auth');

const notifyN8N = async (webhook, payload) => {
  if (!webhook) return;
  try {
    const https = require('https'), http = require('http');
    const url  = new URL(webhook);
    const body = JSON.stringify(payload);
    const lib  = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname, port: url.port||(url.protocol==='https:'?443:80),
      path: url.pathname+url.search, method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},
      timeout: 5000,
    };
    await new Promise(resolve=>{
      const r=lib.request(opts,res=>{res.resume();resolve();});
      r.on('error',resolve); r.on('timeout',()=>{r.destroy();resolve();});
      r.write(body); r.end();
    });
    console.log(`[n8n] ${payload.evento}`);
  } catch(e){ console.error('[n8n]',e.message); }
};

const getWebhook = async (empresa_id) => {
  if (process.env.N8N_WEBHOOK) return process.env.N8N_WEBHOOK;
  const { rows } = await pool.query('SELECT n8n_webhook FROM empresas WHERE id=$1',[empresa_id]);
  return rows[0]?.n8n_webhook;
};

// ── GET /api/admin/dashboard
router.get('/dashboard', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const [clientes,pendentes,aprovados,reprovados,volume,precads] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clientes WHERE empresa_id=$1',[eid]),
      pool.query("SELECT COUNT(*) FROM emprestimos WHERE empresa_id=$1 AND status='em_analise'",[eid]),
      pool.query("SELECT COUNT(*) FROM emprestimos WHERE empresa_id=$1 AND status='aprovado'",[eid]),
      pool.query("SELECT COUNT(*) FROM emprestimos WHERE empresa_id=$1 AND status='reprovado'",[eid]),
      pool.query('SELECT COALESCE(SUM(valor),0) AS total FROM emprestimos WHERE empresa_id=$1',[eid]),
      pool.query('SELECT COUNT(*) FROM pre_cadastros WHERE empresa_id=$1 AND ativo=true',[eid]),
    ]);
    return res.json({
      clientes:      parseInt(clientes.rows[0].count),
      pendentes:     parseInt(pendentes.rows[0].count),
      aprovados:     parseInt(aprovados.rows[0].count),
      reprovados:    parseInt(reprovados.rows[0].count),
      volume:        parseFloat(volume.rows[0].total),
      pre_cadastros: parseInt(precads.rows[0].count),
    });
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro no dashboard.' }); }
});

// ── GET /api/admin/prazos
router.get('/prazos', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const { rows } = await pool.query(`
      SELECT e.id, e.valor, e.valor_com_juros, e.data_solicitacao, e.data_aprovacao,
             e.data_vencimento, e.status, e.observacao,
             c.nome AS cliente_nome, c.telefone AS cliente_telefone,
             c.email AS cliente_email, c.cpf AS cliente_cpf,
             c.pix_tipo, c.pix_chave,
             EXTRACT(DAY FROM (e.data_vencimento - NOW()))::int AS dias_restantes,
             CASE
               WHEN e.status='pago'                                           THEN 'pago'
               WHEN NOW() > e.data_vencimento                                 THEN 'vencido'
               WHEN EXTRACT(DAY FROM (e.data_vencimento-NOW()))<=3            THEN 'critico'
               WHEN EXTRACT(DAY FROM (e.data_vencimento-NOW()))<=7            THEN 'urgente'
               WHEN EXTRACT(DAY FROM (e.data_vencimento-NOW()))<=15           THEN 'atencao'
               ELSE 'normal'
             END AS urgencia
      FROM emprestimos e
      JOIN clientes c ON c.id=e.cliente_id
      WHERE e.empresa_id=$1 AND e.status IN ('aprovado','pago')
      ORDER BY e.data_vencimento ASC NULLS LAST
    `, [eid]);
    return res.json(rows);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao buscar prazos.' }); }
});

// ── PATCH /api/admin/emprestimos/:id/pago
router.patch('/emprestimos/:id/pago', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const { rows } = await pool.query(`
      UPDATE emprestimos SET status='pago',data_pagamento=NOW(),atualizado_em=NOW()
      WHERE id=$1 AND empresa_id=$2 AND status='aprovado' RETURNING *
    `, [req.params.id, eid]);
    if (!rows.length) return res.status(404).json({ error:'Não encontrado ou já pago.' });
    const emp = rows[0];
    const { rows: cr } = await pool.query('SELECT nome,telefone,email FROM clientes WHERE id=$1',[emp.cliente_id]);
    // Registra entrada no caixa (cliente pagou)
    await pool.query(
      `INSERT INTO caixa_transacoes (empresa_id, admin_id, tipo, valor, descricao)
       VALUES ($1,$2,'pagamento',$3,$4)`,
      [eid, req.user.id, emp.valor_com_juros, `Recebimento empréstimo #${emp.id} — ${cr[0]?.nome||''}`]
    );
    notifyN8N(await getWebhook(eid), { evento:'pagamento_confirmado', emprestimo_id:emp.id, valor_com_juros:emp.valor_com_juros, data_pagamento:emp.data_pagamento, cliente:cr[0]||{} });
    return res.json(emp);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao marcar pagamento.' }); }
});

// ── GET /api/admin/emprestimos
router.get('/emprestimos', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const { rows } = await pool.query(`
      SELECT e.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone, c.cpf AS cliente_cpf
      FROM emprestimos e JOIN clientes c ON c.id=e.cliente_id
      WHERE e.empresa_id=$1 ORDER BY e.criado_em DESC
    `, [eid]);
    return res.json(rows);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao buscar empréstimos.' }); }
});

// ── PATCH /api/admin/emprestimos/:id/decidir
router.patch('/emprestimos/:id/decidir', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { decisao, observacao } = req.body;
  const eid = req.user.empresa_id;
  if (!['aprovado','reprovado'].includes(decisao))
    return res.status(400).json({ error:'Decisão inválida.' });
  try {
    const extra = decisao==='aprovado' ? `,data_aprovacao=NOW(),data_vencimento=NOW()+INTERVAL '30 days'` : '';
    const { rows } = await pool.query(`
      UPDATE emprestimos SET status=$1,admin_id=$2,observacao=$3,atualizado_em=NOW() ${extra}
      WHERE id=$4 AND empresa_id=$5 AND status='em_analise' RETURNING *
    `, [decisao, req.user.id, observacao||null, id, eid]);
    if (!rows.length) return res.status(404).json({ error:'Não encontrado ou já decidido.' });
    const emp = rows[0];
    const { rows: cr } = await pool.query('SELECT nome,telefone,email,cpf FROM clientes WHERE id=$1',[emp.cliente_id]);
    // Registra saída no caixa quando aprovado
    if (decisao === 'aprovado') {
      await pool.query(
        `INSERT INTO caixa_transacoes (empresa_id, admin_id, tipo, valor, descricao)
         VALUES ($1,$2,'emprestimo',$3,$4)`,
        [eid, req.user.id, emp.valor, `Empréstimo #${emp.id} aprovado — ${cr[0]?.nome||''}`]
      );
    }
    notifyN8N(await getWebhook(eid), { evento:`emprestimo_${decisao}`, emprestimo_id:emp.id, decisao, observacao:observacao||null, valor:emp.valor, valor_com_juros:emp.valor_com_juros, data_aprovacao:emp.data_aprovacao, data_vencimento:emp.data_vencimento, prazo_dias:30, cliente:cr[0]||{} });
    return res.json(emp);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao processar decisão.' }); }
});

// ── POST /api/admin/clientes — cadastrar cliente pelo admin
router.post('/clientes', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  const { nome, cpf, rg, email, telefone, pix_tipo, pix_chave, cidade, estado, senha } = req.body;
  if (!nome || !cpf || !telefone || !senha)
    return res.status(400).json({ error: 'Nome, CPF, telefone e senha são obrigatórios.' });

  const cleanTel = telefone.replace(/\D/g,'');
  const cleanCpf = cpf.replace(/\D/g,'');
  try {
    // Garante que o pré-cadastro existe (cria automaticamente se não existir)
    await pool.query(
      `INSERT INTO pre_cadastros (empresa_id, telefone, nome, limite_credito)
       VALUES ($1,$2,$3,0) ON CONFLICT (empresa_id, telefone) DO NOTHING`,
      [eid, cleanTel, nome]
    );
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(`
      INSERT INTO clientes
        (empresa_id,nome,cpf,rg,email,telefone,pix_tipo,pix_chave,cidade,estado,senha_hash,lgpd_aceito,lgpd_data)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,NOW())
      RETURNING id,nome,email,telefone,cpf,empresa_id
    `, [eid, nome, cleanCpf, rg||null, email||null, cleanTel,
        pix_tipo||null, pix_chave||null, cidade||null, estado||null, hash]);
    return res.status(201).json(rows[0]);
  } catch(e) {
    if (e.code==='23505') {
      if (e.constraint?.includes('cpf'))      return res.status(409).json({ error:'CPF já cadastrado.' });
      if (e.constraint?.includes('telefone')) return res.status(409).json({ error:'Telefone já cadastrado.' });
      if (e.constraint?.includes('email'))    return res.status(409).json({ error:'E-mail já cadastrado.' });
    }
    console.error(e); return res.status(500).json({ error:'Erro ao cadastrar cliente.' });
  }
});

// ── PATCH /api/admin/clientes/:id — editar cliente
router.patch('/clientes/:id', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  const { nome, email, rg, pix_tipo, pix_chave, cidade, estado, cep, rua, numero, bairro } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE clientes SET
        nome=$1, email=$2, rg=$3, pix_tipo=$4, pix_chave=$5,
        cidade=$6, estado=$7, cep=$8, rua=$9, numero=$10, bairro=$11
      WHERE id=$12 AND empresa_id=$13 RETURNING *
    `, [nome, email||null, rg||null, pix_tipo||null, pix_chave||null,
        cidade||null, estado||null, cep||null, rua||null, numero||null, bairro||null,
        req.params.id, eid]);
    if (!rows.length) return res.status(404).json({ error:'Cliente não encontrado.' });
    const { senha_hash, ...cliente } = rows[0];
    return res.json(cliente);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao atualizar.' }); }
});

// ── GET /api/admin/clientes
router.get('/clientes', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const { rows } = await pool.query(`
      SELECT c.id,c.nome,c.cpf,c.rg,c.email,c.telefone,c.cidade,c.estado,
             c.pix_tipo,c.pix_chave,c.lgpd_aceito,c.lgpd_data,c.criado_em,
             COUNT(e.id) AS total_emprestimos, COALESCE(SUM(e.valor),0) AS total_valor
      FROM clientes c LEFT JOIN emprestimos e ON e.cliente_id=c.id
      WHERE c.empresa_id=$1 GROUP BY c.id ORDER BY c.criado_em DESC
    `, [eid]);
    return res.json(rows);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao buscar clientes.' }); }
});

// ── GET/POST/DELETE /api/admin/pre-cadastros
router.get('/pre-cadastros', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.id AS cliente_id FROM pre_cadastros p
      LEFT JOIN clientes c ON c.telefone=p.telefone AND c.empresa_id=p.empresa_id
      WHERE p.empresa_id=$1 ORDER BY p.criado_em DESC
    `, [eid]);
    return res.json(rows);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao buscar pré-cadastros.' }); }
});

router.post('/pre-cadastros', adminMiddleware, async (req, res) => {
  const { telefone, nome, limite_credito } = req.body;
  const eid = req.user.empresa_id;
  if (!telefone||!nome) return res.status(400).json({ error:'Telefone e nome obrigatórios.' });
  const clean = telefone.replace(/\D/g,'');
  const limite = parseFloat(limite_credito) || 0;
  if (limite < 0) return res.status(400).json({ error:'Limite de crédito inválido.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO pre_cadastros (empresa_id,telefone,nome,limite_credito) VALUES ($1,$2,$3,$4) RETURNING *',
      [eid, clean, nome, limite]
    );
    return res.status(201).json(rows[0]);
  } catch(e){
    if (e.code==='23505') return res.status(409).json({ error:'Telefone já pré-cadastrado.' });
    console.error(e); return res.status(500).json({ error:'Erro.' });
  }
});

router.delete('/pre-cadastros/:id', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM pre_cadastros WHERE id=$1 AND empresa_id=$2', [req.params.id, eid]
    );
    if (!rowCount) return res.status(404).json({ error:'Não encontrado.' });
    return res.json({ ok:true });
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao excluir.' }); }
});

// ── PATCH /api/admin/emprestimos/:id/renovar — pagar só os juros
router.patch('/emprestimos/:id/renovar', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const { rows: er } = await pool.query(
      `SELECT * FROM emprestimos WHERE id=$1 AND empresa_id=$2 AND status='aprovado'`,
      [req.params.id, eid]
    );
    if (!er.length) return res.status(404).json({ error:'Não encontrado ou não está ativo.' });
    const emp = er[0];

    const juros = +(emp.valor * 0.30).toFixed(2);
    const novaVenc = new Date(emp.data_vencimento);
    novaVenc.setDate(novaVenc.getDate() + 30);

    const logEntry = `[${new Date().toLocaleString('pt-BR')}] Renovação por pagamento de juros — novo vencimento: ${novaVenc.toLocaleDateString('pt-BR')}`;
    const novaObs = emp.observacao ? `${emp.observacao}\n${logEntry}` : logEntry;

    const { rows } = await pool.query(
      `UPDATE emprestimos SET data_vencimento=$1, observacao=$2, atualizado_em=NOW()
       WHERE id=$3 AND empresa_id=$4 RETURNING *`,
      [novaVenc.toISOString(), novaObs, req.params.id, eid]
    );

    const { rows: cr } = await pool.query('SELECT nome FROM clientes WHERE id=$1',[emp.cliente_id]);
    await pool.query(
      `INSERT INTO caixa_transacoes (empresa_id, admin_id, tipo, valor, descricao) VALUES ($1,$2,'pagamento',$3,$4)`,
      [eid, req.user.id, juros, `Pagamento de juros — Renovação empréstimo #${emp.id} — ${cr[0]?.nome||''}`]
    );

    return res.json(rows[0]);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao renovar empréstimo.' }); }
});

// ── GET /api/admin/caixa  — saldo + últimas transações
router.get('/caixa', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  try {
    const [saldoRes, transacoesRes] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo IN ('deposito','pagamento') THEN valor ELSE -valor END), 0) AS saldo
        FROM caixa_transacoes WHERE empresa_id=$1
      `, [eid]),
      pool.query(`
        SELECT t.*, a.nome AS admin_nome
        FROM caixa_transacoes t
        LEFT JOIN administradores a ON a.id=t.admin_id
        WHERE t.empresa_id=$1
        ORDER BY t.criado_em DESC LIMIT 100
      `, [eid]),
    ]);
    return res.json({
      saldo: parseFloat(saldoRes.rows[0].saldo),
      transacoes: transacoesRes.rows,
    });
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao buscar caixa.' }); }
});

// ── POST /api/admin/caixa  — registrar movimentação manual
router.post('/caixa', adminMiddleware, async (req, res) => {
  const eid = req.user.empresa_id;
  const { tipo, valor, descricao } = req.body;
  if (!['deposito','saque'].includes(tipo))
    return res.status(400).json({ error:'Tipo deve ser deposito ou saque.' });
  const v = parseFloat(valor);
  if (!v || v <= 0) return res.status(400).json({ error:'Valor inválido.' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO caixa_transacoes (empresa_id, admin_id, tipo, valor, descricao)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [eid, req.user.id, tipo, v, descricao||null]);
    return res.status(201).json(rows[0]);
  } catch(e){ console.error(e); return res.status(500).json({ error:'Erro ao registrar movimentação.' }); }
});

module.exports = router;
