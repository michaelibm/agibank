import { useState } from 'react';
import { Btn, Card, Field, Alert, maskCPF, Dots } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';

export default function Login({ onRegister }) {
  const { loginCliente, loginAdmin } = useAuth();
  const [tab,    setTab]    = useState('cliente');
  const [cpf,    setCpf]    = useState('');
  const [login,  setLogin]  = useState('');
  const [slug, setSlug] = useState(localStorage.getItem('agibank_slug')||'agibank');
  const [senha,  setSenha]  = useState('');
  const [err,    setErr]    = useState('');
  const [loading,setLoading]= useState(false);

  const reset = () => { setErr(''); };

  const handleCliente = async () => {
    if (!cpf||!senha) return setErr('Preencha todos os campos.');
    setLoading(true); setErr('');
    try {
      await loginCliente(cpf.replace(/\D/g,''), senha);
    } catch(e){ setErr(e.message); }
    finally   { setLoading(false); }
  };

  const handleAdmin = async () => {
    if (!login||!senha||!slug) return setErr('Preencha todos os campos.');
    setLoading(true); setErr('');
    try { await loginAdmin(login, senha, slug); }
    catch(e){ setErr(e.message); }
    finally { setLoading(false); }
  };


  const TABS = [
    { id:'cliente', label:'Cliente' },
    { id:'admin',   label:'Administrador' },
  ];

  return (
    <div style={S.wrap}>
      <Dots/>
      <div style={S.inner}>
        <div style={S.hero}>
          <img src="/EMG.jpeg" alt="Logo" style={S.logoImg}/>
        </div>

        <div style={S.tabs}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);reset();}}
              style={{...S.tab,...(tab===t.id?S.tabActive:{})}}>
              {t.label}
            </button>
          ))}
        </div>

        <Card style={S.card}>
          {tab==='cliente' && (
            <>
              <h2 style={S.cardTitle}>Acesso ao Sistema</h2>
              <Field label="CPF">
                <input value={cpf} onChange={e=>{setCpf(maskCPF(e.target.value));reset();}}
                  placeholder="000.000.000-00" inputMode="numeric"/>
              </Field>
              <Field label="Senha">
                <input type="password" value={senha} onChange={e=>{setSenha(e.target.value);reset();}}
                  placeholder="••••••"/>
              </Field>
              {err && <Alert type="error">{err}</Alert>}
              <Btn onClick={handleCliente} loading={loading}>Entrar</Btn>
              <div style={S.divRow}><span style={S.line}/><span style={S.or}>ou</span><span style={S.line}/></div>
              <Btn variant="ghost" onClick={onRegister}>Criar minha conta</Btn>
            </>
          )}

          {tab==='admin' && (
            <>
              <h2 style={S.cardTitle}>Painel Administrativo</h2>
              <Field label="Código da Empresa">
                <input value={slug} onChange={e=>{setSlug(e.target.value.toLowerCase());reset();}}
                  placeholder="ex: agibank" autoCapitalize="none"/>
              </Field>
              <Field label="Usuário">
                <input value={login} onChange={e=>{setLogin(e.target.value);reset();}}
                  placeholder="admin" autoCapitalize="none"/>
              </Field>
              <Field label="Senha">
                <input type="password" value={senha} onChange={e=>{setSenha(e.target.value);reset();}}
                  placeholder="••••••"/>
              </Field>
              {err && <Alert type="error">{err}</Alert>}
              <Btn variant="lilac" onClick={handleAdmin} loading={loading}>Entrar como Admin</Btn>
              <p style={S.demo}>Desenvolvedor: Michael Oliveira o ++ </p>
            </>
          )}

        </Card>

        <div style={S.flowers}/>
      </div>
    </div>
  );
}

const S = {
  wrap:      { minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',position:'relative',overflow:'hidden' },
  inner:     { width:'100%',maxWidth:400,position:'relative',zIndex:1 },
  hero:      { textAlign:'center',marginBottom:24 },
  logoImg:   { height:72, objectFit:'contain', display:'block', margin:'0 auto' },
  tabs:      { display:'flex',background:'#fff',border:'1.5px solid var(--border2)',borderRadius:'var(--radius)',padding:4,marginBottom:16,boxShadow:'var(--shadow-sm)' },
  tab:       { flex:1,border:'none',background:'none',color:'var(--muted)',cursor:'pointer',padding:'9px 4px',borderRadius:14,fontSize:12,fontFamily:'inherit',transition:'all .2s',fontWeight:600 },
  tabActive: { background:'linear-gradient(135deg,#FCE4EC,#F8BBD9)',color:'var(--pink)',fontWeight:800 },
  card:      { padding:24 },
  cardTitle: { fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:'var(--text)',marginBottom:20,textAlign:'center' },
  divRow:    { display:'flex',alignItems:'center',gap:12,margin:'18px 0' },
  line:      { flex:1,height:1,background:'var(--border)',display:'block' },
  or:        { color:'var(--muted)',fontSize:12,fontWeight:600 },
  demo:      { textAlign:'center',color:'var(--muted)',fontSize:11,marginTop:14,lineHeight:1.6 },
  flowers:   { textAlign:'center',fontSize:20,marginTop:20,letterSpacing:6,opacity:.7 },
};
