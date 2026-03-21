import { useEffect, useState } from 'react';
import { Card, Btn, Spinner, fmt, fmtDate, maskPhone } from '../components/UI';
import { api } from '../services/api';

// Critico/urgente/atencao → atencao | normal → emdia
const mapUrg = u => {
  if (u === 'vencido') return 'vencido';
  if (u === 'critico' || u === 'urgente' || u === 'atencao') return 'atencao';
  return 'emdia';
};

const CAT = {
  vencido: { label: 'Vencido',  dot: '#F44336', bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828' },
  atencao: { label: 'Atenção',  dot: '#FF9800', bg: '#FFF3E0', border: '#FFCC80', text: '#E65100' },
  emdia:   { label: 'Em Dia',   dot: '#4CAF50', bg: '#F1F8E9', border: '#C5E1A5', text: '#2E7D32' },
  pago:    { label: 'Pago',     dot: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7', text: '#1B5E20' },
};

const FILTROS = [
  { id: 'todos',   label: 'Todos'   },
  { id: 'vencido', label: 'Vencido' },
  { id: 'atencao', label: 'Atenção' },
  { id: 'emdia',   label: 'Em Dia'  },
  { id: 'pago',    label: 'Pagos'   },
];

const Dot = ({ color, size = 10 }) => (
  <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color, flexShrink:0 }}/>
);

export default function ControlePrazos() {
  const [lista,    setLista]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filtro,   setFiltro]   = useState('todos');
  const [busy,     setBusy]     = useState({});
  const [renovBusy,setRenovBusy]= useState({});
  const [msg,      setMsg]      = useState('');
  const [expanded, setExpanded] = useState(null);

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
      setMsg('Quitação registrada com sucesso.');
      load(); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Erro: ' + e.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const pagarJuros = async (id, valor, nome) => {
    const juros = fmt(valor * 0.30);
    if (!window.confirm(`Confirmar pagamento de juros (${juros}) de ${nome}?\n\nO empréstimo será renovado por mais 30 dias.`)) return;
    setRenovBusy(b => ({ ...b, [id]: true }));
    try {
      await api.pagarJuros(id);
      setMsg('Juros registrados. Empréstimo renovado por +30 dias.');
      load(); setTimeout(() => setMsg(''), 4000);
    } catch (e) { setMsg('Erro: ' + e.message); }
    finally { setRenovBusy(b => ({ ...b, [id]: false })); }
  };

  const getCat = (l) => l.status === 'pago' ? CAT.pago : CAT[mapUrg(l.urgencia)];

  const visible = filtro === 'todos'
    ? lista
    : lista.filter(l => (l.status === 'pago' ? 'pago' : mapUrg(l.urgencia)) === filtro);

  const resumo = {
    vencido: lista.filter(l => l.status !== 'pago' && mapUrg(l.urgencia) === 'vencido').length,
    atencao: lista.filter(l => l.status !== 'pago' && mapUrg(l.urgencia) === 'atencao').length,
    emdia:   lista.filter(l => l.status !== 'pago' && mapUrg(l.urgencia) === 'emdia').length,
    pago:    lista.filter(l => l.status === 'pago').length,
  };

  const totalAReceber = lista
    .filter(l => l.status === 'aprovado')
    .reduce((s, l) => s + parseFloat(l.valor_com_juros), 0);

  if (loading) return <Spinner />;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <p style={S.title}>Controle de Prazos</p>
        <p style={S.sub}>Gerencie cobranças e vencimentos</p>
      </div>

      {msg && (
        <div style={{ ...S.msgBox, background:'#E8F5E9', border:'1.5px solid #A5D6A7', color:'#2E7D32' }}>
          {msg}
        </div>
      )}

      {/* Total a receber */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={S.heroCard}>
          <div>
            <p style={S.heroLabel}>Total a Receber</p>
            <p style={S.heroVal}>{fmt(totalAReceber)}</p>
            <p style={S.heroSub}>{lista.filter(l => l.status === 'aprovado').length} crédito(s) em aberto</p>
          </div>
          <span style={{ fontSize:24, color:'rgba(255,255,255,.6)', fontFamily:"'Playfair Display',serif", fontWeight:700 }}>R$</span>
        </div>
      </div>

      {/* Mini resumo com bolinas */}
      <div style={S.resumoRow}>
        {Object.entries(resumo).map(([key, val]) => {
          const c = CAT[key];
          const ativo = filtro === key;
          return (
            <div key={key}
              onClick={() => setFiltro(ativo ? 'todos' : key)}
              style={{ ...S.resumoCard, background:c.bg, border:`1.5px solid ${ativo ? c.dot : c.border}`, boxShadow: ativo ? `0 4px 12px ${c.dot}44` : 'none' }}>
              <Dot color={c.dot} size={10}/>
              <p style={{ ...S.resumoVal, color:c.text }}>{val}</p>
              <p style={S.resumoLabel}>{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div style={S.filtros}>
        {FILTROS.map(f => {
          const cat = CAT[f.id];
          const ativo = filtro === f.id;
          return (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              style={{ ...S.filtroBtn, ...(ativo && cat ? { borderColor:cat.dot, color:cat.text, background:cat.bg } : {}), ...(f.id==='todos'&&ativo ? { borderColor:'var(--pink)', color:'var(--pink)', background:'var(--pink-pale)' } : {}) }}>
              {cat && <Dot color={ativo ? cat.dot : '#bbb'} size={7}/>}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {visible.length === 0 && (
        <div style={S.empty}>
          <p style={{ color:'var(--muted)', marginTop:12 }}>Nenhum registro nesta categoria.</p>
        </div>
      )}

      {visible.map(l => {
        const cat  = getCat(l);
        const dias = parseInt(l.dias_restantes);
        const isOpen = expanded === l.id;

        return (
          <div key={l.id} style={{ ...S.card, background:cat.bg, border:`1.5px solid ${cat.border}` }}>
            <div style={{ ...S.lateralBar, background:cat.dot }} />

            <div style={S.cardInner}>
              {/* Topo */}
              <div style={S.cardTop} onClick={() => setExpanded(isOpen ? null : l.id)}>
                <div style={{ flex:1 }}>
                  <div style={S.cardTitleRow}>
                    {/* Bolinha + label */}
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <Dot color={cat.dot} size={8}/>
                      <span style={{ ...S.urgLabel, color:cat.text }}>{cat.label}</span>
                    </div>
                    <span style={S.cardId}>Crédito #{l.id}</span>
                  </div>
                  <p style={S.clientName}>{l.cliente_nome}</p>
                  <p style={S.clientSub}>{maskPhone(l.cliente_telefone)}</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ ...S.valorTotal, color:cat.text }}>{fmt(l.valor_com_juros)}</p>
                  {l.status !== 'pago' && l.data_vencimento && (
                    <p style={{ ...S.diasLabel, color:cat.dot }}>
                      {dias < 0 ? `${Math.abs(dias)}d atraso` : `${dias} dias`}
                    </p>
                  )}
                  {l.status === 'pago' && <p style={{ color:CAT.pago.text, fontSize:12, fontWeight:700 }}>Pago</p>}
                  <span style={{ color:'var(--muted)', fontSize:14 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Barra de progresso */}
              {l.status !== 'pago' && l.data_vencimento && (
                <div style={S.progWrap}>
                  <div style={S.progBg}>
                    <div style={{ ...S.progFill, width:`${Math.max(0,Math.min(100,((30-Math.max(0,dias))/30)*100))}%`, background:cat.dot }} />
                  </div>
                  <div style={S.progLabels}>
                    <span>Aprovado: {fmtDate(l.data_aprovacao)}</span>
                    <span>Vence: {fmtDate(l.data_vencimento)}</span>
                  </div>
                </div>
              )}

              {/* Detalhes */}
              {isOpen && (
                <div style={S.details}>
                  {[
                    { l:'CPF',         v: l.cliente_cpf },
                    { l:'E-mail',      v: l.cliente_email },
                    { l:'Valor orig.', v: fmt(l.valor) },
                    { l:'Total (30%)', v: fmt(l.valor_com_juros) },
                    { l:'Solicitado',  v: fmtDate(l.data_solicitacao) },
                    { l:'Aprovado',    v: l.data_aprovacao ? fmtDate(l.data_aprovacao) : '—' },
                    { l:'Vencimento',  v: l.data_vencimento ? fmtDate(l.data_vencimento) : '—' },
                    { l:'Chave Pix',   v: l.pix_tipo ? `${l.pix_tipo}: ${l.pix_chave}` : '—' },
                    ...(l.observacao ? [{ l:'Obs.', v:l.observacao }] : []),
                  ].map(({ l: lbl, v }) => (
                    <div key={lbl} style={S.detRow}>
                      <span style={S.detLabel}>{lbl}</span>
                      <span style={S.detVal}>{v}</span>
                    </div>
                  ))}

                  {l.status === 'aprovado' && (
                    <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                      <Btn variant="success" onClick={() => marcarPago(l.id)} loading={busy[l.id]}>
                        Quitar Empréstimo — {fmt(l.valor_com_juros)}
                      </Btn>
                      {l.pode_pagar_juros && (
                        <button
                          onClick={() => pagarJuros(l.id, parseFloat(l.valor), l.cliente_nome)}
                          disabled={renovBusy[l.id]}
                          style={S.jurosBtn}
                        >
                          {renovBusy[l.id] ? '...' : `Pagar Só os Juros — ${fmt(parseFloat(l.valor)*0.30)} (+30 dias)`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ height:32 }}/>
    </div>
  );
}

const S = {
  wrap:        { paddingBottom:32 },
  header:      { padding:'24px 16px 16px' },
  title:       { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:'var(--text)' },
  sub:         { color:'var(--muted)', fontSize:14, marginTop:4 },
  msgBox:      { margin:'0 16px 14px', borderRadius:'var(--radius-sm)', padding:'12px 16px', fontSize:13, fontWeight:600 },
  heroCard:    { background:'linear-gradient(135deg,#E91E8C,#F06292)', borderRadius:'var(--radius)', padding:'20px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 10px 32px rgba(233,30,140,.35)' },
  heroLabel:   { color:'rgba(255,255,255,.85)', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5 },
  heroVal:     { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:30, color:'#fff', marginTop:4 },
  heroSub:     { color:'rgba(255,255,255,.7)', fontSize:12, marginTop:4 },
  resumoRow:   { display:'flex', gap:8, padding:'0 16px 14px', overflowX:'auto' },
  resumoCard:  { flexShrink:0, borderRadius:12, padding:'12px 14px', textAlign:'center', cursor:'pointer', minWidth:80, transition:'box-shadow .2s, border-color .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  resumoVal:   { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22 },
  resumoLabel: { fontSize:9, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:.3 },
  filtros:     { display:'flex', gap:8, padding:'0 16px 14px', overflowX:'auto' },
  filtroBtn:   { background:'#fff', border:'1.5px solid var(--border)', color:'var(--muted)', borderRadius:20, padding:'7px 12px', cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600, whiteSpace:'nowrap', flexShrink:0, display:'flex', alignItems:'center', gap:5 },
  empty:       { textAlign:'center', padding:48 },
  card:        { margin:'0 16px 12px', borderRadius:'var(--radius)', overflow:'hidden', display:'flex', boxShadow:'0 2px 12px rgba(0,0,0,.06)' },
  lateralBar:  { width:5, flexShrink:0 },
  cardInner:   { flex:1, padding:'14px 14px 14px 12px' },
  cardTop:     { display:'flex', gap:10, cursor:'pointer', alignItems:'flex-start' },
  cardTitleRow:{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' },
  urgLabel:    { fontSize:11, fontWeight:800, letterSpacing:.3 },
  cardId:      { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14 },
  clientName:  { fontWeight:700, fontSize:15, color:'var(--text)' },
  clientSub:   { color:'var(--muted)', fontSize:12, marginTop:2 },
  valorTotal:  { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18 },
  diasLabel:   { fontSize:12, fontWeight:700, marginTop:2 },
  progWrap:    { marginTop:10 },
  progBg:      { height:5, background:'rgba(0,0,0,.1)', borderRadius:3, overflow:'hidden' },
  progFill:    { height:'100%', borderRadius:3, transition:'width .5s' },
  progLabels:  { display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 },
  details:     { marginTop:14, paddingTop:14, borderTop:'1px solid rgba(0,0,0,.08)' },
  detRow:      { display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(0,0,0,.06)' },
  detLabel:    { color:'var(--muted)', fontSize:12, fontWeight:600, flexShrink:0 },
  detVal:      { fontSize:12, fontWeight:600, textAlign:'right', wordBreak:'break-all', maxWidth:'65%' },
  jurosBtn:    { width:'100%', background:'#EDE7F6', border:'1.5px solid #9575CD', borderRadius:12, padding:'12px 14px', fontSize:13, fontFamily:'inherit', fontWeight:700, color:'#4527A0', cursor:'pointer', textAlign:'center' },
};
