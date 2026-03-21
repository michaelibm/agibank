import { useEffect, useState } from 'react';
import { Card, Btn, Field, Alert, Spinner } from '../components/UI';
import { api } from '../services/api';

const fmt = (v) =>
  Number(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

const fmtDate = (d) =>
  new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

const TIPO_LABEL = {
  deposito:      { label:'Depósito',      icon:'+', color:'#2E7D32', bg:'#E8F5E9' },
  saque:         { label:'Saque',         icon:'−', color:'#C62828', bg:'#FFEBEE' },
  emprestimo:    { label:'Empréstimo',    icon:'S', color:'#E65100', bg:'#FFF3E0' },
  pagamento:     { label:'Recebimento',   icon:'R', color:'#1565C0', bg:'#E3F2FD' },
  cancelamento:  { label:'Cancelamento',  icon:'✕', color:'#616161', bg:'#F5F5F5' },
};

export default function Financeiro() {
  const [dados,      setDados]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tipo,       setTipo]       = useState('deposito');
  const [valor,      setValor]      = useState('');
  const [descricao,  setDescricao]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState('');
  const [ok,         setOk]         = useState('');

  // Modal cancelamento
  const [cancelModal, setCancelModal] = useState(null); // { id, tipo, valor, descricao }
  const [motivo,      setMotivo]      = useState('');
  const [cancelBusy,  setCancelBusy]  = useState(false);
  const [cancelErr,   setCancelErr]   = useState('');

  const load = () => {
    setLoading(true);
    api.caixa().then(setDados).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async () => {
    if (!valor || parseFloat(valor) <= 0) return setErr('Informe um valor válido.');
    setSaving(true); setErr(''); setOk('');
    try {
      await api.caixaMovimento(tipo, parseFloat(valor), descricao);
      setValor(''); setDescricao('');
      setOk('Movimentação registrada com sucesso!');
      load();
    } catch(e){ setErr(e.message); }
    finally   { setSaving(false); }
  };

  const abrirCancelar = (t) => {
    setCancelModal(t);
    setMotivo('');
    setCancelErr('');
  };

  const confirmarCancelar = async () => {
    if (!motivo.trim()) return setCancelErr('Informe o motivo do cancelamento.');
    setCancelBusy(true); setCancelErr('');
    try {
      await api.caixaCancelar(cancelModal.id, motivo);
      setCancelModal(null);
      setOk('Transação cancelada. Extrato atualizado.');
      load();
    } catch(e){ setCancelErr(e.message); }
    finally   { setCancelBusy(false); }
  };

  if (loading) return <Spinner/>;

  const saldo = dados?.saldo ?? 0;
  const saldoPositivo = saldo >= 0;

  return (
    <div style={S.wrap}>
      {/* Saldo */}
      <Card style={S.saldoCard}>
        <p style={S.saldoLabel}>Saldo em Caixa</p>
        <p style={{ ...S.saldoValor, color: saldoPositivo ? '#2E7D32' : '#C62828' }}>
          {fmt(saldo)}
        </p>
        <p style={S.saldoSub}>
          {saldoPositivo ? 'Caixa positivo' : 'Caixa negativo'}
        </p>
      </Card>

      {/* Formulário */}
      <Card style={S.formCard}>
        <h3 style={S.formTitle}>Nova Movimentação</h3>

        <div style={S.tipoRow}>
          {['deposito','saque'].map(t => (
            <button key={t} onClick={()=>setTipo(t)}
              style={{ ...S.tipoBtn, ...(tipo===t ? { background: TIPO_LABEL[t].bg, color: TIPO_LABEL[t].color, borderColor: TIPO_LABEL[t].color } : {}) }}>
              {TIPO_LABEL[t].label}
            </button>
          ))}
        </div>

        <Field label="Valor (R$)">
          <input
            type="number" min="0.01" step="0.01"
            value={valor}
            onChange={e=>{ setValor(e.target.value); setErr(''); setOk(''); }}
            placeholder="0,00"
            inputMode="decimal"
          />
        </Field>

        <Field label="Descrição (opcional)">
          <input
            value={descricao}
            onChange={e=>setDescricao(e.target.value)}
            placeholder="Ex: Depósito conta Bradesco"
          />
        </Field>

        {err && <Alert type="error">{err}</Alert>}
        {ok  && <Alert type="success">{ok}</Alert>}

        <Btn
          onClick={handleSubmit}
          loading={saving}
          variant={tipo==='saque' ? 'lilac' : undefined}
        >
          Registrar {TIPO_LABEL[tipo].label}
        </Btn>
      </Card>

      {/* Extrato */}
      <Card style={S.extratoCard}>
        <h3 style={S.formTitle}>Extrato</h3>
        {!dados?.transacoes?.length
          ? <p style={S.empty}>Nenhuma movimentação ainda.</p>
          : dados.transacoes.map(t => {
              const meta     = TIPO_LABEL[t.tipo] || TIPO_LABEL.deposito;
              const positivo = ['deposito','pagamento'].includes(t.tipo);
              const cancelado = t.cancelado === true || t.cancelado === 'true';
              const isCancelamento = t.tipo === 'cancelamento';

              return (
                <div key={t.id} style={{ ...S.item, opacity: cancelado ? 0.45 : 1 }}>
                  <div style={{ ...S.itemIcon, background: meta.bg }}>
                    <span style={{ fontSize:13, fontWeight:800, color:meta.color }}>{meta.icon}</span>
                  </div>
                  <div style={S.itemInfo}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ ...S.itemTipo, textDecoration: cancelado ? 'line-through' : 'none' }}>
                        {meta.label}
                      </span>
                      {cancelado && (
                        <span style={S.cancelTag}>Cancelado</span>
                      )}
                    </div>
                    {t.descricao && <span style={S.itemDesc}>{t.descricao}</span>}
                    <span style={S.itemDate}>{fmtDate(t.criado_em)}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                    <span style={{ ...S.itemValor, color: isCancelamento ? '#616161' : (positivo ? '#2E7D32' : '#C62828'), textDecoration: cancelado ? 'line-through' : 'none' }}>
                      {isCancelamento ? '—' : (positivo ? '+' : '-')}{fmt(t.valor)}
                    </span>
                    {!cancelado && !isCancelamento && (
                      <button onClick={() => abrirCancelar(t)} style={S.cancelBtn}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
        }
      </Card>

      {/* Modal cancelamento */}
      {cancelModal && (
        <div style={M.overlay} onClick={() => setCancelModal(null)}>
          <div style={M.box} onClick={e => e.stopPropagation()}>
            <div style={M.header}>
              <p style={M.title}>Cancelar Transação</p>
              <button onClick={() => setCancelModal(null)} style={M.closeBtn}>✕</button>
            </div>
            <div style={M.body}>
              <div style={M.infoBox}>
                <p style={M.infoTipo}>{TIPO_LABEL[cancelModal.tipo]?.label || cancelModal.tipo}</p>
                <p style={M.infoValor}>{fmt(cancelModal.valor)}</p>
                {cancelModal.descricao && <p style={M.infoDesc}>{cancelModal.descricao}</p>}
              </div>
              <p style={M.aviso}>
                Esta ação irá registrar o cancelamento no extrato e ajustar o saldo. O empréstimo do cliente não será alterado.
              </p>
              <Field label="Motivo do cancelamento *">
                <input
                  value={motivo}
                  onChange={e => { setMotivo(e.target.value); setCancelErr(''); }}
                  placeholder="Ex: Lançamento duplicado"
                  autoFocus
                />
              </Field>
              {cancelErr && <Alert type="error">{cancelErr}</Alert>}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setCancelModal(null)} style={M.cancelBtn}>Voltar</button>
                <Btn onClick={confirmarCancelar} loading={cancelBusy} variant="danger" style={{ flex:1 }}>
                  Confirmar Cancelamento
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap:        { padding:'20px 16px 100px', maxWidth:500, margin:'0 auto' },
  saldoCard:   { padding:'28px 24px', textAlign:'center', marginBottom:16 },
  saldoLabel:  { color:'var(--muted)', fontSize:13, fontWeight:600, marginBottom:8 },
  saldoValor:  { fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:800, margin:'0 0 6px' },
  saldoSub:    { color:'var(--muted)', fontSize:12 },
  formCard:    { padding:'20px 20px', marginBottom:16 },
  formTitle:   { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:'var(--text)', marginBottom:16 },
  tipoRow:     { display:'flex', gap:10, marginBottom:16 },
  tipoBtn:     { flex:1, border:'1.5px solid var(--border)', background:'none', borderRadius:12, padding:'10px 4px', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:700, transition:'all .2s', color:'var(--muted)' },
  extratoCard: { padding:'20px 20px' },
  empty:       { color:'var(--muted)', textAlign:'center', fontSize:13, padding:'20px 0' },
  item:        { display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' },
  itemIcon:    { width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  itemInfo:    { flex:1, display:'flex', flexDirection:'column', gap:2 },
  itemTipo:    { fontWeight:700, fontSize:13, color:'var(--text)' },
  itemDesc:    { fontSize:12, color:'var(--muted)' },
  itemDate:    { fontSize:11, color:'var(--muted)' },
  itemValor:   { fontWeight:800, fontSize:14 },
  cancelBtn:   { background:'none', border:'1.5px solid #FFCDD2', color:'#C62828', borderRadius:8, padding:'3px 10px', fontSize:11, fontFamily:'inherit', fontWeight:700, cursor:'pointer' },
  cancelTag:   { background:'#FFEBEE', color:'#C62828', border:'1px solid #FFCDD2', borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:800 },
};

const M = {
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' },
  box:       { background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, maxHeight:'85dvh', overflowY:'auto' },
  header:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 14px', borderBottom:'1.5px solid var(--border2)', position:'sticky', top:0, background:'#fff', zIndex:1 },
  title:     { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:'var(--text)' },
  closeBtn:  { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)', padding:'4px 8px', borderRadius:8 },
  body:      { padding:'16px 20px 32px', display:'flex', flexDirection:'column', gap:12 },
  infoBox:   { background:'#F5F5F5', borderRadius:12, padding:'14px 16px' },
  infoTipo:  { fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:4 },
  infoValor: { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'var(--text)' },
  infoDesc:  { fontSize:12, color:'var(--muted)', marginTop:4 },
  aviso:     { fontSize:12, color:'#E65100', background:'#FFF3E0', border:'1px solid #FFCC80', borderRadius:8, padding:'10px 12px', lineHeight:1.6 },
  cancelBtn: { flex:1, background:'none', border:'1.5px solid var(--border)', borderRadius:14, padding:'13px 8px', fontSize:14, fontFamily:'inherit', fontWeight:700, color:'var(--muted)', cursor:'pointer' },
};
