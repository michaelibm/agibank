import { useEffect, useState } from 'react';
import { Card, Btn, Alert, Spinner, fmtDate } from '../components/UI';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const emptyForm = () => ({ nome:'', login:'', senha:'' });

export default function AdminUsuarios() {
  const { user } = useAuth();
  const [lista,    setLista]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editando, setEditando] = useState(null);
  const [criando,  setCriando]  = useState(false);
  const [form,     setForm]     = useState(emptyForm());
  const [busy,     setBusy]     = useState(false);
  const [msg,      setMsg]      = useState('');
  const [delBusy,  setDelBusy]  = useState({});

  const load = () => {
    setLoading(true);
    api.usuarios().then(setLista).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const openCriar = () => { setForm(emptyForm()); setCriando(true); setMsg(''); };

  const openEdit = (u) => {
    setForm({ nome:u.nome, login:u.login, senha:'' });
    setEditando(u);
    setMsg('');
  };

  const closeModal = () => { setEditando(null); setCriando(false); setMsg(''); };

  const f = (k) => (e) => setForm(p=>({...p,[k]:e.target.value}));

  const salvar = async () => {
    if (!form.nome.trim() || !form.login.trim()) return setMsg('❌ Nome e login são obrigatórios.');
    if (criando && !form.senha) return setMsg('❌ Senha obrigatória.');
    setBusy(true); setMsg('');
    try {
      if (criando) {
        await api.criarUsuario({ nome:form.nome, login:form.login, senha:form.senha });
      } else {
        const data = { nome:form.nome };
        if (form.senha) data.senha = form.senha;
        await api.editarUsuario(editando.id, data);
      }
      closeModal(); load();
    } catch(e){ setMsg('❌ '+e.message); }
    finally   { setBusy(false); }
  };

  const excluir = async (u) => {
    if (!window.confirm(`Excluir o usuário "${u.nome}"?\n\nEle não conseguirá mais fazer login.`)) return;
    setDelBusy(b=>({...b,[u.id]:true}));
    try { await api.excluirUsuario(u.id); load(); }
    catch(e){ setMsg('❌ '+e.message); }
    finally  { setDelBusy(b=>({...b,[u.id]:false})); }
  };

  if(loading) return <Spinner/>;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <p style={S.title}>Usuários</p>
            <p style={S.sub}>Administradores com acesso ao sistema</p>
          </div>
          <button onClick={openCriar} style={S.newBtn}>+ Novo Usuário</button>
        </div>
      </div>

      {msg && !editando && !criando && (
        <Alert type={msg.startsWith('❌')?'error':'success'} style={{margin:'0 0 14px'}}>{msg}</Alert>
      )}

      {lista.length===0 && (
        <div style={S.empty}><p style={{fontSize:36}}>👤</p><p style={{color:'var(--muted)',marginTop:12}}>Nenhum usuário cadastrado.</p></div>
      )}

      {lista.map(u=>(
        <Card key={u.id} style={S.card}>
          <div style={S.cardRow}>
            <div style={{...S.avatar, background: u.id===user?.id ? 'linear-gradient(135deg,#E91E8C,#F48FB1)' : 'linear-gradient(135deg,#9575CD,#CE93D8)'}}>
              {u.nome[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <p style={S.nome}>{u.nome}</p>
                {u.id===user?.id && <span style={S.voceTag}>você</span>}
              </div>
              <p style={S.login}>@{u.login}</p>
              <p style={S.data}>Cadastrado em {fmtDate(u.criado_em)}</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
              <button onClick={()=>openEdit(u)} style={S.editBtn}>Editar</button>
              {u.id!==user?.id && (
                <button
                  onClick={()=>excluir(u)}
                  disabled={delBusy[u.id]}
                  style={S.delBtn}
                >
                  {delBusy[u.id]?'...':'Excluir'}
                </button>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* ── Modal ── */}
      {(criando||editando) && (
        <div style={M.overlay} onClick={closeModal}>
          <div style={M.box} onClick={e=>e.stopPropagation()}>
            <div style={M.header}>
              <p style={M.title}>{criando?'Novo Usuário':'Editar Usuário'}</p>
              <button onClick={closeModal} style={M.closeBtn}>✕</button>
            </div>

            <div style={M.body}>
              {msg && <Alert type={msg.startsWith('❌')?'error':'success'}>{msg}</Alert>}

              <input
                value={form.nome}
                onChange={f('nome')}
                placeholder="Nome completo *"
              />
              <input
                value={form.login}
                onChange={f('login')}
                placeholder="Login (usuário) *"
                disabled={!!editando}
                style={editando?{opacity:.6,background:'var(--bg)'}:{}}
              />
              <input
                value={form.senha}
                onChange={f('senha')}
                placeholder={criando?'Senha *':'Nova senha (deixe em branco para manter)'}
                type="password"
              />
              {editando && (
                <p style={M.hint}>O login não pode ser alterado. Para trocar a senha, preencha o campo acima.</p>
              )}

              <Btn onClick={salvar} loading={busy} style={{marginTop:8}}>
                {criando?'Criar Usuário':'Salvar Alterações'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap:    { padding:'0 16px 32px' },
  header:  { padding:'24px 0 16px' },
  title:   { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:'var(--text)' },
  sub:     { color:'var(--muted)', fontSize:13, marginTop:4 },
  empty:   { textAlign:'center', padding:48 },
  card:    { marginBottom:10 },
  cardRow: { display:'flex', alignItems:'center', gap:12 },
  avatar:  { width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', flexShrink:0, fontFamily:"'Playfair Display',serif", fontSize:20, boxShadow:'0 4px 12px rgba(0,0,0,.15)' },
  nome:    { fontWeight:700, fontSize:15, color:'var(--text)' },
  login:   { color:'var(--muted)', fontSize:13, marginTop:2 },
  data:    { color:'var(--muted)', fontSize:11, marginTop:2 },
  voceTag: { background:'var(--pink-pale)', color:'var(--pink)', border:'1.5px solid var(--border)', borderRadius:10, padding:'2px 8px', fontSize:10, fontWeight:800 },
  newBtn:  { background:'linear-gradient(135deg,#E91E8C,#F06292)', color:'#fff', border:'none', borderRadius:14, padding:'10px 18px', fontSize:13, fontWeight:700, fontFamily:'inherit', cursor:'pointer', boxShadow:'0 4px 14px rgba(233,30,140,.3)', whiteSpace:'nowrap' },
  editBtn: { background:'none', border:'1.5px solid var(--border)', color:'var(--muted)', borderRadius:10, padding:'5px 12px', fontSize:12, fontFamily:'inherit', fontWeight:700, cursor:'pointer' },
  delBtn:  { background:'none', border:'1.5px solid #FFCDD2', color:'var(--red)', borderRadius:10, padding:'5px 12px', fontSize:12, fontFamily:'inherit', fontWeight:700, cursor:'pointer' },
};

const M = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' },
  box:     { background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, maxHeight:'85dvh', overflowY:'auto' },
  header:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 14px', borderBottom:'1.5px solid var(--border2)', position:'sticky', top:0, background:'#fff', zIndex:1 },
  title:   { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:'var(--text)' },
  closeBtn:{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)', padding:'4px 8px', borderRadius:8 },
  body:    { padding:'16px 20px 32px', display:'flex', flexDirection:'column', gap:10 },
  hint:    { fontSize:12, color:'var(--muted)', fontStyle:'italic', marginTop:-4 },
};
