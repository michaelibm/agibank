import { useState } from 'react';
import ClientHome      from './ClientHome';
import Solicitar       from './Solicitar';
import MeusEmprestimos from './MeusEmprestimos';
import Perfil          from './Perfil';
import { Logo }        from '../components/UI';

const TABS = [
  { id:'home',        label:'Início',    icon:'🏠' },
  { id:'solicitar',   label:'Crédito',   icon:'💳' },
  { id:'emprestimos', label:'Histórico', icon:'📋' },
  { id:'perfil',      label:'Perfil',    icon:'👤' },
];

export default function ClientLayout() {
  const [tab, setTab] = useState('home');
  return (
    <div style={S.root}>
      {/* Top bar */}
      <div style={S.topBar}>
        <Logo size="sm"/>
        <div style={S.topRight}>
          <div style={S.dot}/>
          <span style={{color:'var(--muted)',fontSize:12,fontWeight:600}}>Online</span>
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {tab==='home'        && <ClientHome onSolicitar={()=>setTab('solicitar')}/>}
        {tab==='solicitar'   && <Solicitar  onDone={()=>setTab('emprestimos')}/>}
        {tab==='emprestimos' && <MeusEmprestimos onSolicitar={()=>setTab('solicitar')}/>}
        {tab==='perfil'      && <Perfil/>}
      </div>

      {/* Bottom nav */}
      <nav style={S.nav} className="safe-bottom">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{...S.navBtn,...(tab===t.id?S.navActive:{})}}>
            <span style={{fontSize:tab===t.id?21:19}}>{t.icon}</span>
            <span style={{fontSize:10,marginTop:2,fontWeight:tab===t.id?800:500}}>{t.label}</span>
            {tab===t.id && <div style={S.navIndicator}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}

const S = {
  root:         { display:'flex', flexDirection:'column', height:'100dvh', background:'var(--bg)' },
  topBar:       { background:'#fff', borderBottom:'1.5px solid var(--border2)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, boxShadow:'0 2px 12px rgba(233,30,140,.07)' },
  topRight:     { display:'flex', alignItems:'center', gap:6 },
  dot:          { width:7, height:7, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' },
  content:      { flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' },
  nav:          { background:'#fff', borderTop:'1.5px solid var(--border2)', display:'flex', flexShrink:0, boxShadow:'0 -4px 16px rgba(233,30,140,.08)' },
  navBtn:       { flex:1, background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:'10px 4px 8px', display:'flex', flexDirection:'column', alignItems:'center', fontFamily:'inherit', transition:'color .2s', position:'relative' },
  navActive:    { color:'var(--pink)' },
  navIndicator: { position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:20, height:3, borderRadius:'3px 3px 0 0', background:'linear-gradient(135deg,#E91E8C,#F48FB1)' },
};
