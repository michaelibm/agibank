import React from 'react';

// ─── LOGO ─────────────────────────────────────────────────────────────────
export const Logo = ({ size = 'md' }) => {
  const h = size === 'sm' ? 40 : 58;
  return (
    <img
      src="/EMG.png"
      alt="Logo"
      style={{
        height: h, width:'auto', objectFit:'contain', display:'block',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.22))',
      }}
    />
  );
};

// ─── BUTTON ───────────────────────────────────────────────────────────────
const VARIANTS = {
  primary: {
    background:'linear-gradient(135deg,#E91E8C,#F06292)',
    color:'#fff', fontWeight:700,
    boxShadow:'0 6px 20px rgba(233,30,140,.35)',
  },
  danger: {
    background:'linear-gradient(135deg,#F44336,#E57373)',
    color:'#fff', fontWeight:700,
    boxShadow:'0 6px 16px rgba(244,67,54,.25)',
  },
  success: {
    background:'linear-gradient(135deg,#26C281,#66BB6A)',
    color:'#fff', fontWeight:700,
    boxShadow:'0 6px 16px rgba(38,194,129,.3)',
  },
  ghost: {
    background:'#fff',
    border:'1.5px solid var(--border)',
    color:'var(--pink)',
    fontWeight:600,
    boxShadow:'0 2px 8px rgba(233,30,140,.08)',
  },
  gold: {
    background:'linear-gradient(135deg,#F48FB1,#F06292)',
    color:'#fff', fontWeight:700,
    boxShadow:'0 6px 20px rgba(244,143,177,.4)',
  },
  lilac: {
    background:'linear-gradient(135deg,#CE93D8,#BA68C8)',
    color:'#fff', fontWeight:700,
    boxShadow:'0 6px 16px rgba(206,147,216,.35)',
  },
};

export const Btn = ({ children, onClick, variant='primary', style={}, disabled, loading, type='button' }) => (
  <button type={type} onClick={onClick} disabled={disabled || loading}
    style={{
      ...VARIANTS[variant],
      border:'none',
      borderRadius:'var(--radius)',
      padding:'14px 22px',
      cursor: disabled||loading ? 'not-allowed' : 'pointer',
      fontSize:15, fontFamily:'inherit',
      opacity: disabled||loading ? .55 : 1,
      transition:'transform .15s, box-shadow .15s, opacity .15s',
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      width:'100%',
      letterSpacing:.2,
      ...style,
    }}
    onTouchStart={e => { if(!disabled&&!loading) e.currentTarget.style.transform='scale(.97)'; }}
    onTouchEnd={e   => { e.currentTarget.style.transform='scale(1)'; }}
    onMouseEnter={e => { if(!disabled&&!loading) e.currentTarget.style.transform='translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
  >
    {loading && (
      <span style={{
        width:16, height:16,
        border:'2.5px solid rgba(255,255,255,.4)',
        borderTopColor:'#fff',
        borderRadius:'50%',
        animation:'spin .7s linear infinite',
        display:'inline-block',
        flexShrink:0,
      }} />
    )}
    {children}
  </button>
);

// ─── CARD ─────────────────────────────────────────────────────────────────
export const Card = ({ children, style={} }) => (
  <div style={{
    background:'var(--card)',
    border:'1.5px solid var(--border2)',
    borderRadius:'var(--radius)',
    padding:20,
    boxShadow:'0 4px 20px rgba(233,30,140,.07)',
    animation:'fadeUp .3s ease',
    ...style,
  }}>
    {children}
  </div>
);

// ─── FIELD ────────────────────────────────────────────────────────────────
export const Field = ({ label, children, error }) => (
  <div style={{ marginBottom:16 }}>
    <label style={{
      display:'block', fontSize:12,
      color:'var(--pink)', marginBottom:6,
      fontWeight:700, textTransform:'uppercase', letterSpacing:.6,
    }}>
      {label}
    </label>
    {children}
    {error && (
      <p style={{ color:'var(--red)', fontSize:12, marginTop:5, fontWeight:600 }}>{error}</p>
    )}
  </div>
);

// ─── BADGE ────────────────────────────────────────────────────────────────
const STATUS = {
  em_analise:{ label:'Em Análise', color:'#E65100', bg:'#FFF3E0', border:'#FFCC80' },
  aprovado:  { label:'Aprovado',   color:'#2E7D32', bg:'#E8F5E9', border:'#A5D6A7' },
  reprovado: { label:'Reprovado',  color:'#C62828', bg:'#FFEBEE', border:'#EF9A9A' },
  pago:      { label:'Pago',       color:'#1B5E20', bg:'#E8F5E9', border:'#A5D6A7' },
  vencido:   { label:'Vencido',    color:'#6A1B9A', bg:'#F3E5F5', border:'#CE93D8' },
};

export const Badge = ({ status }) => {
  const s = STATUS[status] || { label:status, color:'var(--muted)', bg:'var(--bg2)', border:'var(--border)' };
  return (
    <span style={{
      background:s.bg, color:s.color,
      border:`1.5px solid ${s.border}`,
      borderRadius:20, padding:'4px 13px',
      fontSize:11, fontWeight:800, letterSpacing:.5,
      whiteSpace:'nowrap', fontFamily:'Nunito,sans-serif',
    }}>{s.label}</span>
  );
};

// ─── ALERT ────────────────────────────────────────────────────────────────
export const Alert = ({ type='error', children }) => {
  const map = {
    error:  { color:'#C62828', bg:'#FFEBEE', border:'#FFCDD2' },
    success:{ color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9' },
    info:   { color:'#AD1457', bg:'#FCE4EC', border:'#F8BBD9' },
  };
  const s = map[type] || map.error;
  return (
    <div style={{
      background:s.bg,
      border:`1.5px solid ${s.border}`,
      borderRadius:'var(--radius-sm)',
      padding:'12px 16px',
      color:s.color,
      fontSize:13,
      fontWeight:600,
      marginBottom:16,
      lineHeight:1.5,
    }}>
      {children}
    </div>
  );
};

// ─── SPINNER ──────────────────────────────────────────────────────────────
export const Spinner = ({ size=32 }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, gap:14 }}>
    <div style={{
      width:size, height:size,
      border:'3px solid var(--border)',
      borderTopColor:'var(--pink)',
      borderRadius:'50%',
      animation:'spin .7s linear infinite',
    }} />
    <p style={{ color:'var(--muted)', fontSize:13 }}>Carregando...</p>
  </div>
);

// ─── FORMATTERS ───────────────────────────────────────────────────────────
export const fmt      = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
export const fmtDate  = d => new Date(d).toLocaleDateString('pt-BR');
export const maskCPF  = v => v.replace(/\D/g,'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4').slice(0,14);
export const maskPhone= v => v.replace(/\D/g,'').replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3').slice(0,15);
export const maskCEP  = v => v.replace(/\D/g,'').replace(/(\d{5})(\d{3})/,'$1-$2').slice(0,9);

// ─── DECORATIVE DOTS ──────────────────────────────────────────────────────
export const Dots = () => (
  <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
    {[
      {top:'8%',  left:'5%',  size:80,  op:.07},
      {top:'60%', left:'85%', size:120, op:.06},
      {top:'40%', left:'50%', size:60,  op:.05},
      {top:'85%', left:'10%', size:100, op:.06},
    ].map((d,i) => (
      <div key={i} style={{
        position:'absolute', top:d.top, left:d.left,
        width:d.size, height:d.size,
        borderRadius:'50%',
        background:'radial-gradient(circle,#E91E8C,#F48FB1)',
        opacity:d.op,
        animation:'floatUp 6s ease-in-out infinite',
        animationDelay:`${i*1.5}s`,
      }} />
    ))}
  </div>
);

// ─── TERMO MODAL ──────────────────────────────────────────────────────────────
export const TermoModal = ({ emprestimo, onClose }) => {
  if (!emprestimo) return null;
  const fmtDt = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—';
  return (
    <div style={TM.overlay} onClick={onClose}>
      <div style={TM.box} onClick={e=>e.stopPropagation()}>
        <div style={TM.header}>
          <span style={TM.icon}>📋</span>
          <div>
            <p style={TM.title}>Termo de Contratação</p>
            <p style={TM.sub}>Crédito #{emprestimo.id}</p>
          </div>
          <button onClick={onClose} style={TM.closeBtn}>✕</button>
        </div>

        <div style={TM.dateBox}>
          <span style={TM.dateLabel}>Aceito em</span>
          <span style={TM.dateVal}>{fmtDt(emprestimo.termo_aceito_em)}</span>
        </div>

        <div style={TM.termoBox}>
          {emprestimo.termo_texto
            ? <p style={TM.termoText}>{emprestimo.termo_texto}</p>
            : <p style={{color:'var(--muted)',fontSize:13,textAlign:'center'}}>Termo não registrado nesta solicitação.</p>
          }
        </div>

        <button onClick={onClose} style={TM.okBtn}>Fechar</button>
      </div>
    </div>
  );
};

const TM = {
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  box:       { background:'#fff', borderRadius:20, width:'100%', maxWidth:440, maxHeight:'90dvh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.3)' },
  header:    { display:'flex', alignItems:'center', gap:12, padding:'20px 20px 16px', borderBottom:'1.5px solid var(--border2)' },
  icon:      { fontSize:28, flexShrink:0 },
  title:     { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:'var(--text)' },
  sub:       { fontSize:12, color:'var(--muted)', marginTop:2 },
  closeBtn:  { marginLeft:'auto', background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--muted)', padding:'4px 8px', borderRadius:8 },
  dateBox:   { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#E8F5E9', borderRadius:10, margin:'16px 20px 0', padding:'10px 14px' },
  dateLabel: { fontSize:12, color:'#2E7D32', fontWeight:700 },
  dateVal:   { fontSize:13, fontWeight:800, color:'#1B5E20' },
  termoBox:  { margin:'14px 20px', background:'#FFF8F9', border:'1.5px solid var(--border)', borderRadius:12, padding:'16px 14px' },
  termoText: { fontSize:14, color:'var(--text)', lineHeight:1.9, margin:0, whiteSpace:'pre-wrap' },
  okBtn:     { display:'block', width:'calc(100% - 40px)', margin:'0 20px 20px', padding:'13px', background:'linear-gradient(135deg,#E91E8C,#F48FB1)', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
};
