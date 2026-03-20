import { useState, useEffect } from 'react';
import { Logo, Card, Btn, Field, Alert, Spinner, fmt } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function SuperAdminLayout() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('dashboard');

  const TABS = [
    { id:'dashboard', label:'Dashboard', icon:'📊' },
    { id:'empresas',  label:'Empresas',  icon:'🏢' },
    { id:'nova',      label:'+ Empresa', icon:'➕' },
  ];

  return (
    <div style={S.root}>
      <div style={S.topBar}>
        <Logo size="sm"/>
        <div style={S.right}>
          <span style={S.badge}>🌟 Master</span>
          <button onClick={logout} style={S.logoutBtn}>Sair</button>
        </div>
      </div>

      <div style={S.content}>
        {tab==='dashboard' && <SADashboard/>}
        {tab==='empresas'  && <SAEmpresas onNova={()=>setTab('nova')}/>}
        {tab==='nova'      && <SANovaEmpresa onDone={()=>setTab('empresas')}/>}
      </div>

      <nav style={S.nav} className="safe-bottom">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{...S.navBtn,...(tab===t.id?S.navActive:{})}}>
            <span style={{fontSize:tab===t.id?22:19}}>{t.icon}</span>
            <span style={{fontSize:9,marginTop:3,fontWeight:tab===t.id?800:500}}>{t.label}</span>
            {tab===t.id && <div style={S.navInd}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Dashboard Master
function SADashboard() {
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ api.saStats().then(setStats).finally(()=>setLoading(false)); },[]);
  if(loading) return <Spinner/>;
  return (
    <div style={{padding:'0 16px 32px'}}>
      <div style={{padding:'24px 0 20px'}}>
        <p style={S.title}>Dashboard Master 🌟</p>
        <p style={{color:'var(--muted)',fontSize:14,marginTop:4}}>Visão global de todas as empresas</p>
      </div>
      <div style={S.heroCard}>
        <div>
          <p style={S.heroLabel}>Volume Total na Plataforma</p>
          <p style={S.heroVal}>{fmt(stats.volume)}</p>
        </div>
        <span style={{fontSize:42,animation:'floatUp 4s ease-in-out infinite'}}>🌟</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginTop:16}}>
        {[
          {label:'Empresas Ativas',val:stats.empresas,  icon:'🏢',color:'var(--pink)'},
          {label:'Total Clientes', val:stats.clientes,  icon:'👥',color:'#E65100'},
          {label:'Empréstimos',    val:stats.emprestimos,icon:'📄',color:'#2E7D32'},
        ].map((s,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:'var(--radius)',padding:16,border:'1.5px solid var(--border2)',textAlign:'center'}}>
            <span style={{fontSize:24,display:'block',marginBottom:8}}>{s.icon}</span>
            <p style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:26,color:s.color}}>{s.val}</p>
            <p style={{fontSize:11,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',marginTop:4}}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Lista de Empresas
function SAEmpresas({ onNova }) {
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded,setExpanded]= useState(null);
  const [editWebhook, setEditWebhook] = useState({});
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState('');

  const load = () => { setLoading(true); api.saEmpresas().then(setLista).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const toggle = async (id, ativo) => {
    await api.saToggleEmpresa(id, !ativo);
    setMsg(`Empresa ${!ativo?'ativada':'desativada'} com sucesso!`);
    load(); setTimeout(()=>setMsg(''),3000);
  };

  const saveWebhook = async (id) => {
    setSaving(s=>({...s,[id]:true}));
    try {
      await api.saUpdateEmpresa(id, { n8n_webhook: editWebhook[id] });
      setMsg('✅ Webhook atualizado!');
      load(); setTimeout(()=>setMsg(''),3000);
    } finally { setSaving(s=>({...s,[id]:false})); }
  };

  if(loading) return <Spinner/>;

  return (
    <div style={{padding:'0 16px 32px'}}>
      <div style={{padding:'24px 0 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <p style={S.title}>Empresas 🏢</p>
        <Btn onClick={onNova} style={{width:'auto',padding:'10px 18px',fontSize:13}}>+ Nova</Btn>
      </div>
      {msg && <Alert type="success" style={{marginBottom:14}}>{msg}</Alert>}
      {lista.map(e=>(
        <div key={e.id} style={{...S.empCard, opacity:e.ativo?1:.6}}>
          <div style={S.empTop} onClick={()=>setExpanded(expanded===e.id?null:e.id)}>
            <div style={S.empAvatar}>{e.nome[0].toUpperCase()}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <p style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{e.nome}</p>
                <span style={{background:e.ativo?'#E8F5E9':'#FFEBEE',color:e.ativo?'#2E7D32':'#C62828',border:`1px solid ${e.ativo?'#A5D6A7':'#FFCDD2'}`,borderRadius:10,padding:'2px 8px',fontSize:10,fontWeight:700}}>
                  {e.ativo?'ATIVA':'INATIVA'}
                </span>
                <span style={{background:'var(--pink-pale)',color:'var(--pink)',border:'1px solid var(--border)',borderRadius:10,padding:'2px 8px',fontSize:10,fontWeight:700}}>
                  {e.plano?.toUpperCase()}
                </span>
              </div>
              <p style={{color:'var(--muted)',fontSize:12,marginTop:2}}>/{e.slug} · {e.email||'—'}</p>
            </div>
            <span style={{color:'var(--muted)',fontSize:16,marginLeft:4}}>{expanded===e.id?'▲':'▼'}</span>
          </div>

          {/* Stats rápidos */}
          <div style={S.empStats}>
            <div style={S.empStat}><span style={{color:'var(--pink)',fontWeight:800}}>{e.total_clientes}</span><br/><span style={{fontSize:10,color:'var(--muted)'}}>Clientes</span></div>
            <div style={S.empStat}><span style={{color:'#2E7D32',fontWeight:800}}>{e.total_emprestimos}</span><br/><span style={{fontSize:10,color:'var(--muted)'}}>Créditos</span></div>
            <div style={S.empStat}><span style={{color:'var(--text)',fontWeight:800,fontSize:12}}>{fmt(e.volume_total||0)}</span><br/><span style={{fontSize:10,color:'var(--muted)'}}>Volume</span></div>
          </div>

          {expanded===e.id && (
            <div style={S.empDetails}>
              {/* Webhook n8n editável */}
              <Field label="Webhook n8n">
                <div style={{display:'flex',gap:8}}>
                  <input
                    value={editWebhook[e.id]??e.n8n_webhook??''}
                    onChange={ev=>setEditWebhook(w=>({...w,[e.id]:ev.target.value}))}
                    placeholder="https://n8n.exemplo.com/webhook/..."
                    style={{fontSize:12}}
                  />
                  <Btn onClick={()=>saveWebhook(e.id)} loading={saving[e.id]}
                    style={{width:'auto',padding:'0 14px',fontSize:12}}>
                    Salvar
                  </Btn>
                </div>
              </Field>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <Btn variant={e.ativo?'danger':'success'}
                  onClick={()=>toggle(e.id,e.ativo)}
                  style={{flex:1,fontSize:13}}>
                  {e.ativo?'🔴 Desativar':'✅ Ativar'}
                </Btn>
              </div>
              <p style={{fontSize:11,color:'var(--muted)',marginTop:10}}>ID: {e.id} · Criado: {new Date(e.criado_em).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Nova Empresa
function SANovaEmpresa({ onDone }) {
  const [form, setForm] = useState({
    nome:'', slug:'', cnpj:'', telefone:'', email:'', n8n_webhook:'',
    admin_nome:'', admin_login:'', admin_senha:'',
  });
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);
  const [ok,      setOk]      = useState('');

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if (!form.nome||!form.slug||!form.admin_login||!form.admin_senha)
      return setErr('Nome, slug e credenciais do admin são obrigatórios.');
    setLoading(true); setErr('');
    try {
      await api.saCriarEmpresa(form);
      setOk(`✅ Empresa "${form.nome}" criada! Slug: /${form.slug}`);
      setTimeout(onDone, 2500);
    } catch(e){ setErr(e.message); }
    finally   { setLoading(false); }
  };

  return (
    <div style={{padding:'0 16px 32px'}}>
      <div style={{padding:'24px 0 20px'}}>
        <p style={S.title}>Nova Empresa ➕</p>
      </div>
      <Card>
        <p style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,marginBottom:16}}>Dados da Empresa</p>
        <Field label="Nome da Empresa"><input value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Ex: Credi Manaus"/></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Slug (URL)">
            <input value={form.slug} onChange={e=>set('slug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="credi-manaus"/>
          </Field>
          <Field label="CNPJ"><input value={form.cnpj} onChange={e=>set('cnpj',e.target.value)} placeholder="00.000.000/0001-00"/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="E-mail"><input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="admin@empresa.com" type="email"/></Field>
          <Field label="Telefone"><input value={form.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="(92) 9999-9999"/></Field>
        </div>
        <Field label="Webhook n8n (opcional)"><input value={form.n8n_webhook} onChange={e=>set('n8n_webhook',e.target.value)} placeholder="https://n8n.empresa.com/webhook/..."/></Field>

        <div style={{borderTop:'1px solid var(--border2)',marginTop:16,paddingTop:16}}>
          <p style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,marginBottom:16}}>Admin da Empresa</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Nome do Admin"><input value={form.admin_nome} onChange={e=>set('admin_nome',e.target.value)} placeholder="Administrador"/></Field>
            <Field label="Login"><input value={form.admin_login} onChange={e=>set('admin_login',e.target.value)} placeholder="admin" autoCapitalize="none"/></Field>
          </div>
          <Field label="Senha do Admin"><input type="password" value={form.admin_senha} onChange={e=>set('admin_senha',e.target.value)} placeholder="Mínimo 6 caracteres"/></Field>
        </div>

        {err && <Alert type="error">{err}</Alert>}
        {ok  && <Alert type="success">{ok}</Alert>}
        <Btn onClick={submit} loading={loading}>Criar Empresa 🌸</Btn>
      </Card>

      <div style={{marginTop:16,padding:16,background:'var(--pink-pale)',borderRadius:'var(--radius)',border:'1.5px solid var(--border)'}}>
        <p style={{fontWeight:700,fontSize:13,marginBottom:8}}>💡 Como funciona o multi-tenant?</p>
        <p style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
          Cada empresa tem um <strong>slug único</strong> (ex: <code>credi-manaus</code>).<br/>
          Os clientes e admins dessa empresa fazem login informando esse código.<br/>
          Os dados são 100% isolados entre empresas.
        </p>
      </div>
    </div>
  );
}

const S = {
  root:      { display:'flex',flexDirection:'column',height:'100dvh',background:'var(--bg)' },
  topBar:    { background:'#fff',borderBottom:'1.5px solid var(--border2)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,boxShadow:'0 2px 12px rgba(233,30,140,.07)' },
  right:     { display:'flex',alignItems:'center',gap:10 },
  badge:     { background:'linear-gradient(135deg,#FFF8DC,#FFEAA7)',color:'#B8860B',border:'1.5px solid #FFD700',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:700 },
  logoutBtn: { background:'none',border:'1.5px solid var(--border)',color:'var(--muted)',cursor:'pointer',borderRadius:10,padding:'6px 12px',fontSize:12,fontFamily:'inherit',fontWeight:600 },
  content:   { flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' },
  nav:       { background:'#fff',borderTop:'1.5px solid var(--border2)',display:'flex',flexShrink:0,boxShadow:'0 -4px 16px rgba(233,30,140,.08)' },
  navBtn:    { flex:1,background:'none',border:'none',color:'var(--muted)',cursor:'pointer',padding:'10px 4px 8px',display:'flex',flexDirection:'column',alignItems:'center',fontFamily:'inherit',transition:'color .2s',position:'relative' },
  navActive: { color:'var(--pink)' },
  navInd:    { position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:20,height:3,borderRadius:'3px 3px 0 0',background:'linear-gradient(135deg,#E91E8C,#F48FB1)' },
  title:     { fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:24,color:'var(--text)' },
  heroCard:  { background:'linear-gradient(135deg,#E91E8C,#F06292)',borderRadius:'var(--radius)',padding:'20px 22px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 10px 32px rgba(233,30,140,.35)' },
  heroLabel: { color:'rgba(255,255,255,.85)',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5 },
  heroVal:   { fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:30,color:'#fff',marginTop:4 },
  empCard:   { background:'#fff',border:'1.5px solid var(--border2)',borderRadius:'var(--radius)',marginBottom:12,overflow:'hidden',boxShadow:'0 2px 12px rgba(233,30,140,.05)' },
  empTop:    { display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer' },
  empAvatar: { width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#E91E8C,#F48FB1)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontWeight:700,color:'#fff',fontSize:18,flexShrink:0 },
  empStats:  { display:'flex',borderTop:'1px solid var(--border2)',padding:'10px 16px',gap:0 },
  empStat:   { flex:1,textAlign:'center',fontSize:14,padding:'0 8px',borderRight:'1px solid var(--border2)' },
  empDetails:{ padding:'14px 16px 16px',borderTop:'1px solid var(--border2)',background:'var(--pink-pale)' },
};
