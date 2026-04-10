const cron = require('node-cron');
const pool = require('../db/pool');

const notifyN8N = async (webhook, payload) => {
  if (!webhook) return;
  try {
    const https = require('https'), http = require('http');
    const url  = new URL(webhook);
    const body = JSON.stringify(payload);
    const lib  = url.protocol === 'https:' ? https : http;
    await new Promise((resolve, reject) => {
      const req = lib.request({
        hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      }, res => { res.resume(); resolve(res.statusCode); });
      req.on('error', reject);
      req.write(body); req.end();
    });
    console.log(`[n8n] aviso_vencimento enviado`);
  } catch(e){ console.error('[n8n] aviso_vencimento erro:', e.message); }
};

const getWebhook = async (empresa_id) => {
  if (process.env.N8N_WEBHOOK) return process.env.N8N_WEBHOOK;
  const { rows } = await pool.query('SELECT n8n_webhook FROM empresas WHERE id=$1', [empresa_id]);
  return rows[0]?.n8n_webhook;
};

// Roda todo dia às 08:00
cron.schedule('0 8 * * *', async () => {
  console.log('[cron] Verificando empréstimos vencendo em 3 dias...');
  try {
    const { rows } = await pool.query(`
      SELECT
        e.id AS emprestimo_id,
        e.empresa_id,
        e.valor,
        e.valor_com_juros,
        e.data_vencimento,
        c.nome, c.telefone, c.email, c.cpf, c.pix_tipo, c.pix_chave
      FROM emprestimos e
      JOIN clientes c ON c.id = e.cliente_id
      WHERE e.status = 'aprovado'
        AND e.data_vencimento::date = (CURRENT_DATE + INTERVAL '3 days')::date
    `);

    if (!rows.length) {
      console.log('[cron] Nenhum empréstimo vencendo em 3 dias.');
      return;
    }

    for (const row of rows) {
      const webhook = await getWebhook(row.empresa_id);
      await notifyN8N(webhook, {
        evento:          'aviso_vencimento',
        dias_restantes:  3,
        emprestimo_id:   row.emprestimo_id,
        valor:           parseFloat(row.valor),
        valor_com_juros: parseFloat(row.valor_com_juros),
        data_vencimento: row.data_vencimento,
        cliente: {
          nome:      row.nome,
          telefone:  row.telefone,
          email:     row.email,
          cpf:       row.cpf,
          pix_tipo:  row.pix_tipo,
          pix_chave: row.pix_chave,
        },
      });
    }

    console.log(`[cron] ${rows.length} aviso(s) enviado(s).`);
  } catch(e) {
    console.error('[cron] Erro no job de aviso:', e.message);
  }
}, { timezone: 'America/Manaus' });

console.log('[cron] Job aviso_vencimento agendado (08:00 diário)');
