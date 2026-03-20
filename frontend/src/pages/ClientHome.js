import { useEffect, useState } from 'react';
import { Card, fmt, fmtDate, Badge, Spinner } from '../components/UI';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ClientHome({ onSolicitar }) {
  const { user } = useAuth();
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ api.meus().then(setLoans).finally(()=>setLoading(false)); },[]);

  const diasR = venc => Math.ceil((new Date(venc)-new Date())/86400000);
  const aprovados = loans.filter(l=>l.status==='aprovado');

  if(loading) return <Spinner/>;

  return (
    <div style={S.wrap}>
      {/* Hero banner */}
      <div style={S.hero}>
        <div style={S.heroContent}>
          <p style={S.greet}>Olá, {user?.nome?.split(' ')[0]} 💕</p>
          <p style={S.heroSub}>Seu crédito com carinho</p>
        </div>
        <div style={S.heroEmoji}>🌸</div>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {[
          { label:'Solicitações', val:loans.length,                               color:'var(--pink)',      bg:'#FCE4EC' },
          { label:'Em Análise',   val:loans.filter(l=>l.status==='em_analise').length, color:'#E65100',    bg:'#FFF3E0' },
          { label:'Aprovados',    val:loans.filter(l=>l.status==='aprovado').length,   color:'#2E7D32',    bg:'#E8F5E9' },
        ].map((s,i)=>(
          <div key={i} style={{...S.stat, background:s.bg}}>
            <p style={{...S.statVal, color:s.color}}>{s.val}</p>
            <p style={S.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Vencimentos */}
      {aprovados.length>0 && (
        <div style={{padding:'0 16px 4px'}}>
          <p style={S.sectionTitle}>📅 Vencimentos</p>
          <Card style={{padding:0, overflow:'hidden'}}>
            {aprovados.map((l,i)=>{
              const d=diasR(l.data_vencimento);
              const cor=d<0?'var(--red)':d<=7?'#E65100':'var(--green)';
              const pct=Math.max(0,Math.min(100,((30-Math.max(0,d))/30)*100));
              return (
                <div key={l.id} style={{...S.vencItem, borderBottom:i<aprovados.length-1?'1px solid var(--border2)':'none'}}>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:700, fontSize:14}}>Crédito #{l.id}</p>
                    <p style={{color:'var(--muted)',fontSize:12,marginTop:2}}>Vence {fmtDate(l.data_vencimento)}</p>
                    <div style={S.progBg}><div style={{...S.progFill,width:`${pct}%`,background:cor}}/></div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <p style={{fontWeight:800,color:'var(--pink)',fontSize:16}}>{fmt(l.valor_com_juros)}</p>
                    <p style={{fontWeight:700,fontSize:13,color:cor}}>{d<0?'VENCIDO':`${d} dias`}</p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* CTA */}
      <div style={{padding:'16px'}}>
        <div style={S.cta} onClick={onSolicitar}>
          <div>
            <p style={S.ctaTitle}>Precisa de crédito? 💗</p>
            <p style={S.ctaSub}>Aprovação em até 24 horas</p>
          </div>
          <div style={S.ctaBtn}>→</div>
        </div>
      </div>

      {/* Últimas */}
      {loans.length>0 && (
        <div style={{padding:'0 16px 24px'}}>
          <p style={S.sectionTitle}>Últimas Solicitações</p>
          {loans.slice(0,3).map(l=>(
            <Card key={l.id} style={{marginBottom:10,padding:'14px 16px'}}>
              <div style={S.loanRow}>
                <div>
                  <p style={{fontWeight:700,fontSize:14}}>Crédito #{l.id}</p>
                  <p style={{color:'var(--muted)',fontSize:12}}>{fmtDate(l.data_solicitacao)}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <Badge status={l.status_real||l.status}/>
                  <p style={{fontWeight:700,marginTop:6,color:'var(--text)'}}>{fmt(l.valor)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  wrap:        { paddingBottom:24 },
  hero:        { padding:'24px 20px', background:'linear-gradient(135deg,#FCE4EC,#F8BBD9)', borderBottom:'1.5px solid var(--border)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' },
  heroContent: { flex:1 },
  greet:       { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:'var(--text)' },
  heroSub:     { color:'var(--pink-soft)', fontSize:14, marginTop:4, fontWeight:600 },
  heroEmoji:   { fontSize:52, animation:'floatUp 4s ease-in-out infinite' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, padding:'0 16px', marginBottom:16 },
  stat:        { borderRadius:'var(--radius-sm)', padding:'12px 8px', textAlign:'center', border:'1.5px solid var(--border2)' },
  statVal:     { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24 },
  statLabel:   { fontSize:10, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:.3, marginTop:4 },
  sectionTitle:{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:16, color:'var(--text)', marginBottom:12 },
  vencItem:    { display:'flex', gap:14, alignItems:'center', padding:'14px 16px' },
  progBg:      { height:4, background:'var(--border2)', borderRadius:2, marginTop:8, overflow:'hidden' },
  progFill:    { height:'100%', borderRadius:2, transition:'width .5s' },
  cta:         { background:'linear-gradient(135deg,#E91E8C,#F06292)', borderRadius:'var(--radius)', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', boxShadow:'0 8px 24px rgba(233,30,140,.35)' },
  ctaTitle:    { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:'#fff' },
  ctaSub:      { color:'rgba(255,255,255,.8)', fontSize:13, marginTop:4 },
  ctaBtn:      { width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, fontWeight:700 },
  loanRow:     { display:'flex', justifyContent:'space-between', alignItems:'center' },
};
