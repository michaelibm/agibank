import { useEffect, useState } from 'react';
import { Card, Badge, Spinner, fmt, fmtDate, Btn, TermoModal } from '../components/UI';
import { api } from '../services/api';

export default function MeusEmprestimos({ onSolicitar }) {
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoEmp,setTermoEmp]= useState(null);

  useEffect(()=>{ api.meus().then(setLoans).finally(()=>setLoading(false)); },[]);

  const dias = venc => Math.ceil((new Date(venc)-new Date())/86400000);

  if(loading) return <Spinner/>;

  if(!loans.length) return (
    <div style={S.empty}>
      <p style={{fontSize:56,marginBottom:16,color:'var(--border)'}}>—</p>
      <p style={S.emptyTitle}>Nenhuma solicitação ainda</p>
      <p style={S.emptySub}>Solicite seu primeiro crédito agora!</p>
      <Btn onClick={onSolicitar} style={{maxWidth:260,marginTop:20}}>Solicitar Crédito</Btn>
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <p style={S.title}>Meus Créditos</p>
        <p style={S.count}>{loans.length} solicitação(ões)</p>
      </div>

      <TermoModal emprestimo={termoEmp} onClose={()=>setTermoEmp(null)}/>

      {loans.map(l=>{
        const status=l.status_real||l.status;
        const d=l.data_vencimento?dias(l.data_vencimento):null;
        const cor=d===null?'var(--muted)':d<0?'var(--red)':d<=7?'#E65100':'var(--green)';
        const pct=d!==null?Math.max(0,Math.min(100,((30-Math.max(0,d))/30)*100)):0;
        return (
          <Card key={l.id} style={S.card}>
            <div style={S.cardTop}>
              <div>
                <div style={S.titleRow}>
                  <span style={S.cardId}>Crédito #{l.id}</span>
                  <Badge status={status}/>
                </div>
                <p style={S.cardDate}>{fmtDate(l.data_solicitacao)}</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={S.valorLabel}>Solicitado</p>
                <p style={S.valor}>{fmt(l.valor)}</p>
              </div>
            </div>

            {(status==='aprovado'||status==='vencido') && (
              <div style={S.detBox}>
                <div style={S.detGrid}>
                  <div>
                    <p style={S.detLabel}>Total a pagar</p>
                    <p style={{...S.detVal,color:'var(--pink)',fontSize:20}}>{fmt(l.valor_com_juros)}</p>
                  </div>
                  <div>
                    <p style={S.detLabel}>Vencimento</p>
                    <p style={S.detVal}>{fmtDate(l.data_vencimento)}</p>
                  </div>
                  <div>
                    <p style={S.detLabel}>Prazo</p>
                    <p style={{...S.detVal,color:cor,fontSize:18}}>
                      {d===null?'—':d<0?'VENCIDO':`${d} dias`}
                    </p>
                  </div>
                </div>
                <div style={{marginTop:12}}>
                  <div style={S.progBg}><div style={{...S.progFill,width:`${pct}%`,background:cor}}/></div>
                  <p style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Progresso do prazo</p>
                </div>
                <div style={S.pixBox}>
                  <span style={{fontSize:14,fontWeight:800,color:'var(--pink)'}}>PIX</span>
                  <div>
                    <p style={{fontSize:12,color:'var(--muted)'}}>Pague via Pix</p>
                    <p style={{fontWeight:700,fontSize:13,color:'var(--text)'}}>CNPJ: 00.000.000/0001-00</p>
                  </div>
                </div>
              </div>
            )}

            {status==='em_analise' && (
              <div style={S.analise}>
                <div style={S.pulseDot}/>
                <p style={{color:'#E65100',fontSize:13,fontWeight:600}}>Aguardando análise...</p>
              </div>
            )}

            {status==='reprovado' && (
              <div style={S.reprovado}>
                <p style={{color:'var(--red)',fontSize:13,fontWeight:600}}>Não aprovado. Entre em contato com a AGIBANK.</p>
                {l.observacao && <p style={{color:'var(--muted)',fontSize:12,marginTop:6}}>Motivo: {l.observacao}</p>}
              </div>
            )}

            {l.termo_aceito_em && (
              <button onClick={()=>setTermoEmp(l)} style={S.termoBtn}>
                Ver Termo de Contratação
              </button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

const S = {
  wrap:      { padding:'0 16px 32px' },
  header:    { padding:'24px 0 16px' },
  title:     { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:'var(--text)' },
  count:     { color:'var(--muted)', fontSize:13, marginTop:4 },
  empty:     { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'65dvh', padding:24, textAlign:'center' },
  emptyTitle:{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'var(--text)' },
  emptySub:  { color:'var(--muted)', fontSize:14, marginTop:8 },
  card:      { marginBottom:14 },
  cardTop:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:0 },
  titleRow:  { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 },
  cardId:    { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16 },
  cardDate:  { color:'var(--muted)', fontSize:12 },
  valorLabel:{ fontSize:11, color:'var(--muted)' },
  valor:     { fontWeight:700, fontSize:17 },
  detBox:    { marginTop:14, background:'var(--pink-pale)', borderRadius:'var(--radius-sm)', padding:14 },
  detGrid:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 },
  detLabel:  { fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.3, marginBottom:4, fontWeight:600 },
  detVal:    { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14 },
  progBg:    { height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' },
  progFill:  { height:'100%', borderRadius:3, transition:'width .5s' },
  pixBox:    { display:'flex', alignItems:'center', gap:10, background:'#fff', borderRadius:'var(--radius-sm)', padding:10, marginTop:10, border:'1px solid var(--border2)' },
  analise:   { display:'flex', alignItems:'center', gap:10, marginTop:12, padding:'10px 14px', background:'#FFF3E0', borderRadius:'var(--radius-sm)', border:'1px solid #FFCC80' },
  pulseDot:  { width:8, height:8, borderRadius:'50%', background:'#E65100', animation:'pulse 1.5s infinite', flexShrink:0 },
  reprovado: { marginTop:12, padding:'10px 14px', background:'#FFEBEE', borderRadius:'var(--radius-sm)', border:'1px solid #FFCDD2' },
  termoBtn:  { marginTop:12, width:'100%', background:'none', border:'1.5px solid var(--border)', borderRadius:10, padding:'9px 14px', fontSize:13, fontFamily:'inherit', fontWeight:700, color:'var(--muted)', cursor:'pointer', textAlign:'left' },
};
