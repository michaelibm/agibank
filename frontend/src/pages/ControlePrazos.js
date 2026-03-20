import { useEffect, useState } from 'react';
import { Card, Btn, Spinner, fmt, fmtDate, maskPhone } from '../components/UI';
import { api } from '../services/api';

const URGENCIA = {
  vencido: { label: 'VENCIDO',   bg: '#FFEBEE', border: '#FFCDD2', dot: '#F44336', text: '#C62828' },
  critico: { label: 'CRÍTICO',   bg: '#FFF3E0', border: '#FFCC80', dot: '#FF6D00', text: '#E65100' },
  urgente: { label: 'URGENTE',   bg: '#FFF8E1', border: '#FFE082', dot: '#FFB300', text: '#FF8F00' },
  atencao: { label: 'ATENÇÃO',   bg: '#FCE4EC', border: '#F48FB1', dot: '#E91E8C', text: '#AD1457' },
  normal:  { label: 'NORMAL',    bg: '#F3E5F5', border: '#CE93D8', dot: '#CE93D8', text: '#6A1B9A' },
  pago:    { label: 'PAGO',      bg: '#E8F5E9', border: '#A5D6A7', dot: '#4CAF50', text: '#2E7D32' },
};

const FILTROS = [
  { id: 'todos',   label: 'Todos' },
  { id: 'vencido', label: '🔴 Vencidos' },
  { id: 'critico', label: '🟠 Críticos (≤3d)' },
  { id: 'urgente', label: '🟡 Urgentes (≤7d)' },
  { id: 'atencao', label: '🌸 Atenção (≤15d)' },
  { id: 'normal',  label: '💜 Normal' },
  { id: 'pago',    label: '✅ Pagos' },
];

export default function ControlePrazos() {
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState('todos');
  const [busy,    setBusy]    = useState({});
  const [msg,     setMsg]     = useState('');
  const [expanded,setExpanded]= useState(null);
  const [renovBusy,setRenovBusy]= useState({});

  const load = () => {
    setLoading(true);
    api.prazos().then(setLista).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const marcarPago = async (id) => {
    if (!window.confirm('Confirmar quitação total (principal + juros)?')) return;
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await api.marcarPago(id);
      setMsg('✅ Quitação registrada com sucesso!');
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg('❌ ' + e.message);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  };

  const pagarJuros = async (id, valor, nomeCliente) => {
    const juros = fmt(valor * 0.30);
    if (!window.confirm(`Confirmar pagamento de juros (${juros}) de ${nomeCliente}?\n\nO empréstimo será renovado por mais 30 dias.`)) return;
    setRenovBusy(b => ({ ...b, [id]: true }));
    try {
      await api.pagarJuros(id);
      setMsg('🔄 Juros registrados! Empréstimo renovado por +30 dias.');
      load();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setMsg('❌ ' + e.message);
    } finally {
      setRenovBusy(b => ({ ...b, [id]: false }));
    }
  };

  const visible = filtro === 'todos'
    ? lista
    : lista.filter(l => (l.status === 'pago' ? 'pago' : l.urgencia) === filtro);

  // Resumo por urgência
  const resumo = {
    vencido: lista.filter(l => l.urgencia === 'vencido').length,
    critico: lista.filter(l => l.urgencia === 'critico').length,
    urgente: lista.filter(l => l.urgencia === 'urgente').length,
    atencao: lista.filter(l => l.urgencia === 'atencao').length,
    normal:  lista.filter(l => l.urgencia === 'normal').length,
    pago:    lista.filter(l => l.status   === 'pago').length,
  };

  const totalAReceber = lista
    .filter(l => l.status === 'aprovado')
    .reduce((s, l) => s + parseFloat(l.valor_com_juros), 0);

  if (loading) return <Spinner />;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <p style={S.title}>Controle de Prazos 📅</p>
        <p style={S.sub}>Gerencie cobranças e vencimentos</p>
      </div>

      {/* Aviso mensagem */}
      {msg && (
        <div style={{
          ...S.msgBox,
          background: msg.startsWith('✅') ? '#E8F5E9' : '#FFEBEE',
          border: `1.5px solid ${msg.startsWith('✅') ? '#A5D6A7' : '#FFCDD2'}`,
          color: msg.startsWith('✅') ? '#2E7D32' : '#C62828',
        }}>{msg}</div>
      )}

      {/* Card total a receber */}
      <div style={{ padding: '0 0 16px' }}>
        <div style={S.heroCard}>
          <div>
            <p style={S.heroLabel}>Total a Receber</p>
            <p style={S.heroVal}>{fmt(totalAReceber)}</p>
            <p style={S.heroSub}>{lista.filter(l => l.status === 'aprovado').length} crédito(s) em aberto</p>
          </div>
          <span style={{ fontSize: 42, animation: 'floatUp 4s ease-in-out infinite' }}>💰</span>
        </div>
      </div>

      {/* Mini resumo visual */}
      <div style={S.resumoRow}>
        {Object.entries(resumo).map(([key, val]) => {
          const u = URGENCIA[key];
          return (
            <div key={key} onClick={() => setFiltro(key === filtro ? 'todos' : key)}
              style={{
                ...S.resumoCard,
                background: u.bg,
                border: `1.5px solid ${filtro === key ? u.dot : u.border}`,
                boxShadow: filtro === key ? `0 4px 12px ${u.dot}44` : 'none',
              }}>
              <div style={{ ...S.resumoDot, background: u.dot }} />
              <p style={{ ...S.resumoVal, color: u.text }}>{val}</p>
              <p style={S.resumoLabel}>{u.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div style={S.filtros}>
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ ...S.filtroBtn, ...(filtro === f.id ? S.filtroAtivo : {}) }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {visible.length === 0 && (
        <div style={S.empty}>
          <p style={{ fontSize: 40 }}>🌸</p>
          <p style={{ color: 'var(--muted)', marginTop: 12 }}>Nenhum registro nesta categoria.</p>
        </div>
      )}

      {visible.map(l => {
        const urg = l.status === 'pago' ? URGENCIA.pago : (URGENCIA[l.urgencia] || URGENCIA.normal);
        const dias = parseInt(l.dias_restantes);
        const isOpen = expanded === l.id;

        return (
          <div key={l.id} style={{ ...S.card, background: urg.bg, border: `1.5px solid ${urg.border}` }}>
            {/* Barra colorida lateral */}
            <div style={{ ...S.lateralBar, background: urg.dot }} />

            <div style={S.cardInner}>
              {/* Topo clicável */}
              <div style={S.cardTop} onClick={() => setExpanded(isOpen ? null : l.id)}>
                <div style={{ flex: 1 }}>
                  <div style={S.cardTitleRow}>
                    <span style={{ ...S.urgBadge, background: urg.dot, color: '#fff' }}>
                      {urg.label}
                    </span>
                    <span style={S.cardId}>Crédito #{l.id}</span>
                  </div>
                  <p style={S.clientName}>{l.cliente_nome}</p>
                  <p style={S.clientSub}>{maskPhone(l.cliente_telefone)}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ ...S.valorTotal, color: urg.text }}>{fmt(l.valor_com_juros)}</p>
                  {l.status !== 'pago' && l.data_vencimento && (
                    <p style={{ ...S.diasLabel, color: urg.text }}>
                      {dias < 0
                        ? `${Math.abs(dias)} dia(s) atraso`
                        : `${dias} dia(s)`}
                    </p>
                  )}
                  {l.status === 'pago' && <p style={{ color: '#2E7D32', fontSize: 12, fontWeight: 700 }}>✓ Pago</p>}
                  <span style={{ color: 'var(--muted)', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Barra de progresso do prazo */}
              {l.status !== 'pago' && l.data_vencimento && (
                <div style={S.progWrap}>
                  <div style={S.progBg}>
                    <div style={{
                      ...S.progFill,
                      width: `${Math.max(0, Math.min(100, ((30 - Math.max(0, dias)) / 30) * 100))}%`,
                      background: urg.dot,
                    }} />
                  </div>
                  <div style={S.progLabels}>
                    <span>Aprovado: {fmtDate(l.data_aprovacao)}</span>
                    <span>Vence: {fmtDate(l.data_vencimento)}</span>
                  </div>
                </div>
              )}

              {/* Detalhes expandidos */}
              {isOpen && (
                <div style={S.details}>
                  {[
                    { l: 'CPF',          v: l.cliente_cpf },
                    { l: 'E-mail',       v: l.cliente_email },
                    { l: 'Valor orig.',  v: fmt(l.valor) },
                    { l: 'Total (30%)',  v: fmt(l.valor_com_juros) },
                    { l: 'Solicitado',   v: fmtDate(l.data_solicitacao) },
                    { l: 'Aprovado',     v: l.data_aprovacao ? fmtDate(l.data_aprovacao) : '—' },
                    { l: 'Vencimento',   v: l.data_vencimento ? fmtDate(l.data_vencimento) : '—' },
                    { l: 'Chave Pix',    v: l.pix_tipo ? `${l.pix_tipo}: ${l.pix_chave}` : '—' },
                    ...(l.observacao ? [{ l: 'Obs.', v: l.observacao }] : []),
                  ].map(({ l: lbl, v }) => (
                    <div key={lbl} style={S.detRow}>
                      <span style={S.detLabel}>{lbl}</span>
                      <span style={S.detVal}>{v}</span>
                    </div>
                  ))}

                  {/* Baixa */}
                  {l.status === 'aprovado' && (
                    <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                      <Btn
                        variant="success"
                        onClick={() => marcarPago(l.id)}
                        loading={busy[l.id]}
                      >
                        ✅ Quitar Empréstimo — {fmt(l.valor_com_juros)}
                      </Btn>
                      <button
                        onClick={() => pagarJuros(l.id, parseFloat(l.valor), l.cliente_nome)}
                        disabled={renovBusy[l.id]}
                        style={S.jurosBtn}
                      >
                        {renovBusy[l.id] ? '...' : `🔄 Pagar Só os Juros — ${fmt(parseFloat(l.valor)*0.30)} (+30 dias)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ height: 32 }} />
    </div>
  );
}

const S = {
  wrap:        { paddingBottom: 32 },
  header:      { padding: '24px 16px 16px' },
  title:       { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 24, color: 'var(--text)' },
  sub:         { color: 'var(--muted)', fontSize: 14, marginTop: 4 },
  msgBox:      { margin: '0 16px 14px', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 13, fontWeight: 600 },
  heroCard:    { background: 'linear-gradient(135deg,#E91E8C,#F06292)', borderRadius: 'var(--radius)', padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 32px rgba(233,30,140,.35)', margin: '0 16px' },
  heroLabel:   { color: 'rgba(255,255,255,.85)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 },
  heroVal:     { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 30, color: '#fff', marginTop: 4 },
  heroSub:     { color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 4 },
  resumoRow:   { display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto' },
  resumoCard:  { flexShrink: 0, borderRadius: 12, padding: '10px 12px', textAlign: 'center', cursor: 'pointer', minWidth: 72, transition: 'box-shadow .2s, border-color .2s' },
  resumoDot:   { width: 8, height: 8, borderRadius: '50%', margin: '0 auto 6px' },
  resumoVal:   { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 22 },
  resumoLabel: { fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3, marginTop: 2 },
  filtros:     { display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto' },
  filtroBtn:   { background: '#fff', border: '1.5px solid var(--border)', color: 'var(--muted)', borderRadius: 20, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 },
  filtroAtivo: { borderColor: 'var(--pink)', color: 'var(--pink)', background: 'var(--pink-pale)' },
  empty:       { textAlign: 'center', padding: 48 },
  card:        { margin: '0 16px 12px', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', boxShadow: '0 2px 12px rgba(0,0,0,.06)' },
  lateralBar:  { width: 5, flexShrink: 0 },
  cardInner:   { flex: 1, padding: '14px 14px 14px 12px' },
  cardTop:     { display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' },
  cardTitleRow:{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' },
  urgBadge:    { borderRadius: 10, padding: '2px 9px', fontSize: 10, fontWeight: 800, letterSpacing: .5 },
  cardId:      { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14 },
  clientName:  { fontWeight: 700, fontSize: 15, color: 'var(--text)' },
  clientSub:   { color: 'var(--muted)', fontSize: 12, marginTop: 2 },
  valorTotal:  { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18 },
  diasLabel:   { fontSize: 12, fontWeight: 700, marginTop: 2 },
  progWrap:    { marginTop: 10 },
  progBg:      { height: 5, background: 'rgba(0,0,0,.1)', borderRadius: 3, overflow: 'hidden' },
  progFill:    { height: '100%', borderRadius: 3, transition: 'width .5s' },
  progLabels:  { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4, fontWeight: 600 },
  details:     { marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)' },
  detRow:      { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,.06)' },
  detLabel:    { color: 'var(--muted)', fontSize: 12, fontWeight: 600, flexShrink: 0 },
  detVal:      { fontSize: 12, fontWeight: 600, textAlign: 'right', wordBreak: 'break-all', maxWidth: '65%' },
  jurosBtn:    { width:'100%', background:'#EDE7F6', border:'1.5px solid #9575CD', borderRadius:12, padding:'12px 14px', fontSize:13, fontFamily:'inherit', fontWeight:700, color:'#4527A0', cursor:'pointer', textAlign:'center' },
};
