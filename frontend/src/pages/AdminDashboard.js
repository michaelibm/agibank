import { useEffect, useState } from 'react';
import { Card, Spinner, fmt } from '../components/UI';
import { api } from '../services/api';

export default function AdminDashboard({ onGotoSolicitacoes }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ api.dashboard().then(setData).finally(()=>setLoading(false)); },[]);

  if(loading) return <Spinner/>;

  const stats = [
    { label:'Clientes',      val:data.clientes,      icon:'👥', color:'var(--pink)',   bg:'#FCE4EC' },
    { label:'Pendentes',     val:data.pendentes,      icon:'⏳', color:'#E65100',       bg:'#FFF3E0' },
    { label:'Aprovados',     val:data.aprovados,      icon:'✅', color:'#2E7D32',       bg:'#E8F5E9' },
    { label:'Reprovados',    val:data.reprovados,     icon:'❌', color:'#C62828',       bg:'#FFEBEE' },
    { label:'Pré-cadastros', val:data.pre_cadastros,  icon:'📋', color:'var(--lilac)',  bg:'#F3E5F5' },
  ];

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <p style={S.title}>Dashboard 🌸</p>
        <p style={S.sub}>Visão geral do sistema</p>
      </div>

      {/* Volume destaque */}
      <div style={{padding:'0 16px 16px'}}>
        <div style={S.heroCard}>
          <div>
            <p style={S.heroLabel}>Volume Total Solicitado</p>
            <p style={S.heroVal}>{fmt(data.volume)}</p>
          </div>
          <span style={{fontSize:40,animation:'floatUp 4s ease-in-out infinite'}}>💰</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={S.grid}>
        {stats.map((s,i)=>(
          <div key={i} style={{...S.stat, background:s.bg}}>
            <span style={S.statIcon}>{s.icon}</span>
            <p style={{...S.statVal, color:s.color}}>{s.val}</p>
            <p style={S.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerta pendentes */}
      {data.pendentes>0 && (
        <div style={{padding:'0 16px'}}>
          <div style={S.alert} onClick={onGotoSolicitacoes}>
            <div>
              <p style={{fontWeight:700,color:'#E65100',fontSize:15}}>
                ⚠️ {data.pendentes} solicitação(ões) aguardando análise
              </p>
              <p style={{color:'var(--muted)',fontSize:13,marginTop:4}}>Toque para analisar agora</p>
            </div>
            <span style={{color:'#E65100',fontSize:22}}>→</span>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap:      { paddingBottom:24 },
  header:    { padding:'24px 16px 16px' },
  title:     { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:26, color:'var(--text)' },
  sub:       { color:'var(--muted)', fontSize:14, marginTop:4 },
  heroCard:  { background:'linear-gradient(135deg,#E91E8C,#F06292)', borderRadius:'var(--radius)', padding:'20px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 10px 32px rgba(233,30,140,.35)' },
  heroLabel: { color:'rgba(255,255,255,.85)', fontSize:13, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 },
  heroVal:   { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:32, color:'#fff', marginTop:6 },
  grid:      { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, padding:'0 16px', marginBottom:16 },
  stat:      { borderRadius:'var(--radius-sm)', padding:'16px', textAlign:'center', border:'1.5px solid var(--border2)' },
  statIcon:  { fontSize:24, display:'block', marginBottom:8 },
  statLabel: { fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.4, marginTop:6, fontWeight:600 },
  statVal:   { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:28 },
  alert:     { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#FFF3E0', border:'1.5px solid #FFCC80', borderRadius:'var(--radius)', padding:'16px 20px', cursor:'pointer' },
};
