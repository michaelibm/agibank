const router = require('express').Router();
const pool   = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const notifyN8N = async (webhook, payload) => {
  if (!webhook) return;
  try {
    const https = require('https'), http = require('http');
    const url = new URL(webhook);
    const body = JSON.stringify(payload);
    const lib  = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname, port: url.port || (url.protocol==='https:'?443:80),
      path: url.pathname+url.search, method: 'POST',
      headers: { 'Content-Type':'application/json','Content-Length':Buffer.byteLength(body) },
      timeout: 5000,
    };
    await new Promise(resolve => {
      const r = lib.request(opts, res=>{ res.resume(); resolve(); });
      r.on('error', resolve); r.on('timeout',()=>{ r.destroy(); resolve(); });
      r.write(body); r.end();
    });
    console.log(`[n8n] ${payload.evento} enviado`);
  } catch(e) { console.error('[n8n]', e.message); }
};

// GET /api/emprestimos — meus empréstimos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*,
              CASE WHEN e.status='aprovado' AND NOW()>e.data_vencimento
                   THEN 'vencido' ELSE e.status END AS status_real
       FROM emprestimos e
       WHERE e.cliente_id=$1 AND e.empresa_id=$2
       ORDER BY e.criado_em DESC`,
      [req.user.id, req.user.empresa_id]
    );
    return res.json(rows);
  } catch(e) { console.error(e); return res.status(500).json({ error: 'Erro ao buscar empréstimos.' }); }
});

// POST /api/emprestimos — solicitar
router.post('/', authMiddleware, async (req, res) => {
  const { valor, termo_texto } = req.body;
  if (!valor || valor < 100)   return res.status(400).json({ error: 'Valor mínimo: R$ 100,00.' });
  if (valor > 50000)            return res.status(400).json({ error: 'Valor máximo: R$ 50.000,00.' });

  try {
    const { rows: ativos } = await pool.query(
      `SELECT id FROM emprestimos WHERE cliente_id=$1 AND empresa_id=$2 AND status IN ('em_analise','aprovado')`,
      [req.user.id, req.user.empresa_id]
    );
    if (ativos.length) return res.status(409).json({ error: 'Você já possui uma solicitação em andamento.' });

    // Verifica limite de crédito do pré-cadastro
    const { rows: pc } = await pool.query(
      `SELECT pc.limite_credito FROM pre_cadastros pc
       JOIN clientes c ON c.telefone=pc.telefone AND c.empresa_id=pc.empresa_id
       WHERE c.id=$1 AND pc.empresa_id=$2 AND pc.ativo=true`,
      [req.user.id, req.user.empresa_id]
    );
    if (pc.length && parseFloat(pc[0].limite_credito) > 0) {
      const limite = parseFloat(pc[0].limite_credito);
      const { rows: sd } = await pool.query(
        `SELECT COALESCE(SUM(valor),0) AS total FROM emprestimos WHERE cliente_id=$1 AND empresa_id=$2 AND status='aprovado'`,
        [req.user.id, req.user.empresa_id]
      );
      const saldoDevedor = parseFloat(sd[0].total);
      const disponivel   = limite - saldoDevedor;
      if (saldoDevedor + valor > limite) {
        const dispFmt = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(disponivel < 0 ? 0 : disponivel);
        return res.status(400).json({ error: `Limite de crédito insuficiente. Limite disponível: ${dispFmt}` });
      }
    }

    const { rows: cr } = await pool.query(
      'SELECT nome,telefone,email,cpf,pix_tipo,pix_chave FROM clientes WHERE id=$1', [req.user.id]
    );
    const cliente = cr[0];

    const valor_com_juros = +(valor * 1.30).toFixed(2);
    const { rows } = await pool.query(
      `INSERT INTO emprestimos (empresa_id,cliente_id,valor,valor_com_juros,status,termo_texto,termo_aceito_em)
       VALUES ($1,$2,$3,$4,'em_analise',$5,NOW()) RETURNING *`,
      [req.user.empresa_id, req.user.id, valor, valor_com_juros, termo_texto||null]
    );

    // Webhook: .env tem prioridade, fallback no banco
    const { rows: emp } = await pool.query('SELECT n8n_webhook FROM empresas WHERE id=$1',[req.user.empresa_id]);
    const webhook = process.env.N8N_WEBHOOK || emp[0]?.n8n_webhook;
    notifyN8N(webhook, {
      evento: 'nova_solicitacao', emprestimo_id: rows[0].id,
      data_solicitacao: rows[0].data_solicitacao,
      valor, valor_com_juros, prazo_dias: 30,
      cliente: {
        id: req.user.id,
        nome: cliente?.nome,
        telefone: cliente?.telefone,
        email: cliente?.email,
        cpf: cliente?.cpf,
        pix_tipo: cliente?.pix_tipo,
        pix_chave: cliente?.pix_chave,
      },
    });

    return res.status(201).json(rows[0]);
  } catch(e) { console.error(e); return res.status(500).json({ error: 'Erro ao criar solicitação.' }); }
});

module.exports = router;
