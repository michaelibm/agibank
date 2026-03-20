import { useEffect, useState } from 'react';
import { Card, Badge, Btn, Spinner, Alert, fmt, fmtDate, maskPhone, TermoModal } from '../components/UI';
import { api } from '../services/api';

export default function AdminSolicitacoes() {
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('todos');
  const [obs,     setObs]     = useState({});
  const [busy,    setBusy]    = useState({});
  const [msg,     setMsg]     = useState('');
  const [termoEmp,setTermoEmp]= useState(null);

  const load = () => { setLoading(true); api.adminEmprestimos().then(setLoans).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const decidir = async (id, decisao) => {
    setBusy(b=>({...b,[id]:true}));
    try {
      await api.decidir(id, decisao, obs[id]||'');
      setMsg(`✅ Crédito #${id} ${decisao==='aprovado'?'aprovado':'reprovado'} com sucesso!`);
      load(); setTimeout(()=>setMsg(''),3500);
    } catch(e){ setMsg('❌ '+e.message); }
    finally   { setBusy(b=>({...b,[id]:false})); }
  };

  const FILTERS = [
    {id:'todos',label:'Todos'},
    {id:'em_analise',label:'Pendentes'},
    {id:'aprovado',label:'Aprovados'},
    {id:'reprovado',label:'Reprovados'},
  ];
  const visible = filter==='todos'?loans:loans.filter(l=>l.status===filter);

  if(loading) return <Spinner/>;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <p style={S.title}>Solicitações 📄</p>
      </div>

      <TermoModal emprestimo={termoEmp} onClose={()=>setTermoEmp(null)}/>
      {msg && <Alert type={msg.startsWith('✅')?'success':'error'}>{msg}</Alert>}

      {/* Filtros */}
      <div style={S.filters}>
        {FILTERS.map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)}
            style={{...S.filterBtn,...(filter===f.id?S.filterActive:{})}}>
            {f.label}
            {f.id!=='todos' && <span style={S.filterBadge}>{loans.filter(l=>l.status===f.id).length}</span>}
          </button>
        ))}
      </div>

      {visible.length===0 && (
        <div style={S.empty}><p style={{fontSize:36}}>🌸</p><p style={{color:'var(--muted)',marginTop:12}}>Nenhuma solicitação.</p></div>
      )}

      {visible.map(l=>(
        <Card key={l.id} style={S.card}>
          <div style={S.cardTop}>
            <div style={{flex:1}}>
              <div style={S.titleRow}>
                <span style={S.cardId}>Crédito #{l.id}</span>
                <Badge status={l.status}/>
              </div>
              <p style={S.clientName}>{l.cliente_nome}</p>
              <p style={S.cardSub}>{maskPhone(l.cliente_telefone)} · CPF: {l.cliente_cpf}</p>
              <p style={S.cardSub}>{fmtDate(l.data_solicitacao)}</p>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <p style={S.valLabel}>Solicitado</p>
              <p style={S.val}>{fmt(l.valor)}</p>
              <p style={S.valLabel}>Total (30%)</p>
              <p style={{...S.val,color:'var(--pink)',fontSize:16}}>{fmt(l.valor_com_juros)}</p>
            </div>
          </div>

          {l.status==='aprovado' && (
            <div style={S.approvedInfo}>
              <span style={{fontSize:12,color:'var(--muted)'}}>Aprovado: {fmtDate(l.data_aprovacao)}</span>
              <span style={{fontSize:12,color:'var(--muted)'}}>Vence: {fmtDate(l.data_vencimento)}</span>
            </div>
          )}

          {l.status==='em_analise' && (
            <div style={{marginTop:14}}>
              <textarea
                value={obs[l.id]||''}
                onChange={e=>setObs(o=>({...o,[l.id]:e.target.value}))}
                placeholder="Observação (opcional)..."
                rows={2}
                style={{marginBottom:10,fontSize:13,resize:'none'}}
              />
              <div style={S.btnRow}>
                <Btn variant="success" onClick={()=>decidir(l.id,'aprovado')} loading={busy[l.id]} style={{flex:1}}>✓ Aprovar</Btn>
                <Btn variant="danger"  onClick={()=>decidir(l.id,'reprovado')} loading={busy[l.id]} style={{flex:1}}>✗ Reprovar</Btn>
              </div>
            </div>
          )}
          {l.observacao && <p style={S.obs}>Obs: {l.observacao}</p>}
          {l.termo_aceito_em && (
            <button onClick={()=>setTermoEmp(l)} style={S.termoBtn}>
              📋 Ver Termo de Contratação · Aceito em {new Date(l.termo_aceito_em).toLocaleString('pt-BR')}
            </button>
          )}
        </Card>
      ))}
    </div>
  );
}

const S = {
  wrap:        { padding:'0 16px 32px' },
  header:      { padding:'24px 0 16px' },
  title:       { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:'var(--text)' },
  filters:     { display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:4 },
  filterBtn:   { background:'#fff', border:'1.5px solid var(--border)', color:'var(--muted)', borderRadius:20, padding:'7px 14px', cursor:'pointer', fontSize:13, fontFamily:'inherit', display:'flex', gap:6, alignItems:'center', whiteSpace:'nowrap', flexShrink:0, fontWeight:600 },
  filterActive:{ borderColor:'var(--pink)', color:'var(--pink)', background:'var(--pink-pale)' },
  filterBadge: { background:'var(--border2)', borderRadius:10, padding:'1px 7px', fontSize:11 },
  empty:       { textAlign:'center', padding:48 },
  card:        { marginBottom:12 },
  cardTop:     { display:'flex', gap:12 },
  titleRow:    { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 },
  cardId:      { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15 },
  clientName:  { fontWeight:700, fontSize:15, marginBottom:2, color:'var(--text)' },
  cardSub:     { color:'var(--muted)', fontSize:12 },
  valLabel:    { fontSize:10, color:'var(--muted)', textTransform:'uppercase', fontWeight:600 },
  val:         { fontWeight:700, fontSize:14 },
  approvedInfo:{ display:'flex', justifyContent:'space-between', marginTop:12, padding:'10px 0', borderTop:'1px solid var(--border2)' },
  btnRow:      { display:'flex', gap:10 },
  obs:         { color:'var(--muted)', fontSize:12, marginTop:10, fontStyle:'italic' },
  termoBtn:    { marginTop:10, width:'100%', background:'#F3E5F5', border:'1.5px solid #CE93D8', borderRadius:10, padding:'9px 14px', fontSize:12, fontFamily:'inherit', fontWeight:700, color:'#6A1B9A', cursor:'pointer', textAlign:'left' },
};
