import { useState } from 'react';
import { Logo } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard    from './AdminDashboard';
import AdminSolicitacoes from './AdminSolicitacoes';
import AdminClientes     from './AdminClientes';
import PreCadastros      from './PreCadastros';
import ControlePrazos    from './ControlePrazos';
import Financeiro        from './Financeiro';
import AdminUsuarios     from './AdminUsuarios';

const TABS = [
  { id:'dashboard',    label:'Dashboard',  icon:'📊' },
  { id:'solicitacoes', label:'Análise',    icon:'📄' },
  { id:'prazos',       label:'Prazos',     icon:'📅' },
  { id:'clientes',     label:'Clientes',   icon:'👥' },
  { id:'pre',          label:'Pré-Cad.',   icon:'📋' },
  { id:'financeiro',   label:'Financeiro', icon:'💰' },
  { id:'usuarios',     label:'Usuários',   icon:'👤' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('dashboard');

  return (
    <div style={S.root}>
      <div style={S.topBar}>
        <Logo size="sm"/>
        <div style={S.right}>
          <span style={S.badge}>⚙️ Admin</span>
          <button onClick={logout} style={S.logoutBtn}>Sair</button>
        </div>
      </div>

      <div style={S.content}>
        {tab==='dashboard'    && <AdminDashboard onGotoSolicitacoes={()=>setTab('solicitacoes')}/>}
        {tab==='solicitacoes' && <AdminSolicitacoes/>}
        {tab==='prazos'       && <ControlePrazos/>}
        {tab==='clientes'     && <AdminClientes/>}
        {tab==='pre'          && <PreCadastros/>}
        {tab==='financeiro'   && <Financeiro/>}
        {tab==='usuarios'     && <AdminUsuarios/>}
      </div>

      <nav style={S.nav} className="safe-bottom">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{...S.navBtn,...(tab===t.id?S.navActive:{})}}>
            <span style={{fontSize:tab===t.id?20:18}}>{t.icon}</span>
            <span style={{fontSize:9,marginTop:3,fontWeight:tab===t.id?800:500}}>{t.label}</span>
            {tab===t.id && <div style={S.navInd}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}

const S = {
  root:     { display:'flex', flexDirection:'column', height:'100dvh', background:'var(--bg)' },
  topBar:   { background:'#fff', borderBottom:'1.5px solid var(--border2)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, boxShadow:'0 2px 12px rgba(233,30,140,.07)' },
  right:    { display:'flex', alignItems:'center', gap:10 },
  badge:    { background:'linear-gradient(135deg,#FCE4EC,#F8BBD9)', color:'var(--pink)', border:'1.5px solid var(--border)', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700 },
  logoutBtn:{ background:'none', border:'1.5px solid var(--border)', color:'var(--muted)', cursor:'pointer', borderRadius:10, padding:'6px 12px', fontSize:12, fontFamily:'inherit', fontWeight:600 },
  content:  { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' },
  nav:      { background:'#fff', borderTop:'1.5px solid var(--border2)', display:'flex', flexShrink:0, boxShadow:'0 -4px 16px rgba(233,30,140,.08)' },
  navBtn:   { flex:1, background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:'10px 4px 8px', display:'flex', flexDirection:'column', alignItems:'center', fontFamily:'inherit', transition:'color .2s', position:'relative' },
  navActive:{ color:'var(--pink)' },
  navInd:   { position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:20, height:3, borderRadius:'3px 3px 0 0', background:'linear-gradient(135deg,#E91E8C,#F48FB1)' },
};
