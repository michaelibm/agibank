import { useEffect, useState } from 'react';
import { Card, Btn, Field, Alert, Spinner } from '../components/UI';
import { api } from '../services/api';

const fmt = (v) =>
  Number(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

const fmtDate = (d) =>
  new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

const TIPO_LABEL = {
  deposito:   { label:'Depósito',   icon:'+', color:'#2E7D32', bg:'#E8F5E9' },
  saque:      { label:'Saque',      icon:'−', color:'#C62828', bg:'#FFEBEE' },
  emprestimo: { label:'Empréstimo', icon:'S', color:'#E65100', bg:'#FFF3E0' },
  pagamento:  { label:'Recebimento',icon:'R', color:'#1565C0', bg:'#E3F2FD' },
};

export default function Financeiro() {
  const [dados,    setDados]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tipo,     setTipo]     = useState('deposito');
  const [valor,    setValor]    = useState('');
  const [descricao,setDescricao]= useState('');
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const [ok,       setOk]       = useState('');

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
              const meta = TIPO_LABEL[t.tipo] || TIPO_LABEL.deposito;
              const positivo = ['deposito','pagamento'].includes(t.tipo);
              return (
                <div key={t.id} style={S.item}>
                  <div style={{ ...S.itemIcon, background: meta.bg }}>
                    <span style={{ fontSize:13, fontWeight:800, color:meta.color }}>{meta.icon}</span>
                  </div>
                  <div style={S.itemInfo}>
                    <span style={S.itemTipo}>{meta.label}</span>
                    {t.descricao && <span style={S.itemDesc}>{t.descricao}</span>}
                    <span style={S.itemDate}>{fmtDate(t.criado_em)}</span>
                  </div>
                  <span style={{ ...S.itemValor, color: positivo ? '#2E7D32' : '#C62828' }}>
                    {positivo ? '+' : '-'}{fmt(t.valor)}
                  </span>
                </div>
              );
            })
        }
      </Card>
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
  itemValor:   { fontWeight:800, fontSize:14, flexShrink:0 },
};
