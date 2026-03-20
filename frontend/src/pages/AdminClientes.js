import { useEffect, useState } from 'react';
import { Card, Spinner, fmt, fmtDate, maskPhone, Btn, Alert } from '../components/UI';
import { api } from '../services/api';

const PIXES = ['CPF','CNPJ','E-mail','Telefone','Aleatória'];

const emptyForm = () => ({
  nome:'', cpf:'', rg:'', email:'', telefone:'',
  pix_tipo:'', pix_chave:'', cidade:'', estado:'',
  cep:'', rua:'', numero:'', bairro:'', senha:'',
});

export default function AdminClientes() {
  const [clientes,  setClientes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [expanded,  setExpanded]  = useState(null);
  const [editando,  setEditando]  = useState(null);   // objeto cliente
  const [criando,   setCriando]   = useState(false);
  const [form,      setForm]      = useState(emptyForm());
  const [busy,      setBusy]      = useState(false);
  const [msg,       setMsg]       = useState('');

  const load = () => {
    setLoading(true);
    api.adminClientes().then(setClientes).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const openEdit = (c) => {
    setForm({
      nome: c.nome||'', cpf: c.cpf||'', rg: c.rg||'',
      email: c.email||'', telefone: maskPhone(c.telefone||''),
      pix_tipo: c.pix_tipo||'', pix_chave: c.pix_chave||'',
      cidade: c.cidade||'', estado: c.estado||'',
      cep: c.cep||'', rua: c.rua||'', numero: c.numero||'', bairro: c.bairro||'',
      senha: '',
    });
    setEditando(c);
    setMsg('');
  };

  const openCriar = () => {
    setForm(emptyForm());
    setCriando(true);
    setMsg('');
  };

  const closeModal = () => { setEditando(null); setCriando(false); setMsg(''); };

  const f = (k) => (e) => setForm(prev=>({...prev,[k]:e.target.value}));

  const salvarEdicao = async () => {
    if (!form.nome.trim()) return setMsg('❌ Nome obrigatório.');
    setBusy(true); setMsg('');
    try {
      await api.editarCliente(editando.id, {
        nome:form.nome, email:form.email, rg:form.rg,
        pix_tipo:form.pix_tipo, pix_chave:form.pix_chave,
        cidade:form.cidade, estado:form.estado,
        cep:form.cep, rua:form.rua, numero:form.numero, bairro:form.bairro,
      });
      closeModal(); load();
    } catch(e){ setMsg('❌ '+e.message); }
    finally   { setBusy(false); }
  };

  const salvarNovo = async () => {
    if (!form.nome.trim()||!form.cpf||!form.telefone||!form.senha)
      return setMsg('❌ Nome, CPF, telefone e senha são obrigatórios.');
    setBusy(true); setMsg('');
    try {
      await api.criarCliente({
        nome:form.nome, cpf:form.cpf.replace(/\D/g,''),
        rg:form.rg, email:form.email,
        telefone:form.telefone.replace(/\D/g,''),
        pix_tipo:form.pix_tipo, pix_chave:form.pix_chave,
        cidade:form.cidade, estado:form.estado, senha:form.senha,
      });
      closeModal(); load();
    } catch(e){ setMsg('❌ '+e.message); }
    finally   { setBusy(false); }
  };

  const filtered = clientes.filter(c=>
    c.nome.toLowerCase().includes(search.toLowerCase())||
    c.cpf.includes(search)||
    c.telefone.includes(search.replace(/\D/g,''))
  );

  if(loading) return <Spinner/>;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <p style={S.title}>Clientes 👥</p>
            <p style={S.count}>{clientes.length} cadastrado(s)</p>
          </div>
          <button onClick={openCriar} style={S.newBtn}>+ Novo Cliente</button>
        </div>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Buscar por nome, CPF ou telefone..."
        style={{marginBottom:16}}
      />

      {filtered.length===0 && (
        <div style={S.empty}><p style={{fontSize:36}}>🌸</p><p style={{color:'var(--muted)',marginTop:12}}>Nenhum cliente encontrado.</p></div>
      )}

      {filtered.map(c=>(
        <Card key={c.id} style={{marginBottom:10,padding:0,overflow:'hidden'}}>
          <div style={S.row} onClick={()=>setExpanded(expanded===c.id?null:c.id)}>
            <div style={S.avatar}>{c.nome[0].toUpperCase()}</div>
            <div style={{flex:1}}>
              <p style={S.nome}>{c.nome}</p>
              <p style={S.sub}>{maskPhone(c.telefone)} · {c.cidade||'—'}/{c.estado||'—'}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{color:'var(--pink)',fontWeight:700,fontSize:14}}>{fmt(c.total_valor||0)}</p>
              <p style={S.sub}>{c.total_emprestimos} crédito(s)</p>
            </div>
            <span style={{color:'var(--muted)',fontSize:16,marginLeft:8}}>{expanded===c.id?'▲':'▼'}</span>
          </div>

          {expanded===c.id && (
            <div style={S.details}>
              {[
                {l:'CPF',v:c.cpf},{l:'RG',v:c.rg||'—'},{l:'E-mail',v:c.email||'—'},
                {l:'Endereço',v:c.rua?`${c.rua}, ${c.numero} — ${c.bairro}`:'—'},
                {l:'Chave Pix',v:c.pix_tipo?`${c.pix_tipo}: ${c.pix_chave}`:'—'},
                {l:'LGPD',v:c.lgpd_aceito?`✅ Aceito em ${fmtDate(c.lgpd_data)}`:'—'},
                {l:'Cadastro',v:fmtDate(c.criado_em)},
              ].map(({l,v})=>(
                <div key={l} style={S.detRow}>
                  <span style={S.detLabel}>{l}</span>
                  <span style={S.detVal}>{v}</span>
                </div>
              ))}
              <button onClick={()=>openEdit(c)} style={S.editBtn}>✏️ Editar dados</button>
            </div>
          )}
        </Card>
      ))}

      {/* ── Modal Editar / Criar ── */}
      {(editando||criando) && (
        <div style={M.overlay} onClick={closeModal}>
          <div style={M.box} onClick={e=>e.stopPropagation()}>
            <div style={M.header}>
              <p style={M.title}>{criando?'Cadastrar Cliente':'Editar Cliente'}</p>
              <button onClick={closeModal} style={M.closeBtn}>✕</button>
            </div>

            <div style={M.body}>
              {msg && <Alert type={msg.startsWith('❌')?'error':'success'}>{msg}</Alert>}

              <p style={M.section}>Dados Pessoais</p>
              <input value={form.nome} onChange={f('nome')} placeholder="Nome completo *"/>
              {criando && <>
                <input value={form.cpf}      onChange={f('cpf')}      placeholder="CPF *" inputMode="numeric"/>
                <input value={form.telefone} onChange={e=>setForm(p=>({...p,telefone:maskPhone(e.target.value)}))} placeholder="Telefone * (92) 99999-9999" type="tel" inputMode="numeric"/>
                <input value={form.senha}    onChange={f('senha')}    placeholder="Senha *" type="password"/>
              </>}
              <input value={form.rg}    onChange={f('rg')}    placeholder="RG"/>
              <input value={form.email} onChange={f('email')} placeholder="E-mail" type="email"/>

              <p style={M.section}>Endereço</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <input value={form.cidade} onChange={f('cidade')} placeholder="Cidade"/>
                <input value={form.estado} onChange={f('estado')} placeholder="Estado"/>
                <input value={form.cep}    onChange={f('cep')}    placeholder="CEP"/>
                <input value={form.bairro} onChange={f('bairro')} placeholder="Bairro"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'3fr 1fr',gap:8}}>
                <input value={form.rua}    onChange={f('rua')}    placeholder="Rua"/>
                <input value={form.numero} onChange={f('numero')} placeholder="Nº"/>
              </div>

              <p style={M.section}>Chave Pix</p>
              <select value={form.pix_tipo} onChange={f('pix_tipo')} style={{marginBottom:8}}>
                <option value="">Selecione o tipo</option>
                {PIXES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <input value={form.pix_chave} onChange={f('pix_chave')} placeholder="Chave Pix"/>

              <Btn
                onClick={criando?salvarNovo:salvarEdicao}
                loading={busy}
                style={{marginTop:16}}
              >
                {criando?'Cadastrar Cliente':'Salvar Alterações'}
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
  count:   { color:'var(--muted)', fontSize:13, marginTop:4 },
  empty:   { textAlign:'center', padding:40 },
  row:     { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' },
  avatar:  { width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#E91E8C,#F48FB1)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', flexShrink:0, fontFamily:"'Playfair Display',serif", fontSize:18, boxShadow:'0 4px 12px rgba(233,30,140,.25)' },
  nome:    { fontWeight:700, fontSize:15, color:'var(--text)' },
  sub:     { color:'var(--muted)', fontSize:12 },
  details: { padding:'12px 16px 16px', borderTop:'1px solid var(--border2)', background:'var(--pink-pale)' },
  detRow:  { display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border2)' },
  detLabel:{ color:'var(--muted)', fontSize:12, flexShrink:0, fontWeight:600 },
  detVal:  { fontSize:12, fontWeight:600, textAlign:'right', wordBreak:'break-all', maxWidth:'65%', color:'var(--text)' },
  editBtn: { marginTop:12, width:'100%', background:'none', border:'1.5px solid var(--pink)', color:'var(--pink)', borderRadius:10, padding:'9px', fontSize:13, fontFamily:'inherit', fontWeight:700, cursor:'pointer' },
  newBtn:  { background:'linear-gradient(135deg,#E91E8C,#F06292)', color:'#fff', border:'none', borderRadius:14, padding:'10px 18px', fontSize:13, fontWeight:700, fontFamily:'inherit', cursor:'pointer', boxShadow:'0 4px 14px rgba(233,30,140,.3)', whiteSpace:'nowrap' },
};

const M = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' },
  box:     { background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, maxHeight:'92dvh', overflowY:'auto' },
  header:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 14px', borderBottom:'1.5px solid var(--border2)', position:'sticky', top:0, background:'#fff', zIndex:1 },
  title:   { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:'var(--text)' },
  closeBtn:{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)', padding:'4px 8px', borderRadius:8 },
  body:    { padding:'16px 20px 32px', display:'flex', flexDirection:'column', gap:8 },
  section: { fontWeight:800, fontSize:12, color:'var(--pink)', textTransform:'uppercase', letterSpacing:.5, marginTop:8 },
};
