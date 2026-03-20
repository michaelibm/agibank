import { useEffect, useState } from 'react';
import { Card, Btn, Alert, Spinner, maskPhone, fmt } from '../components/UI';
import { api } from '../services/api';

export default function PreCadastros() {
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome,    setNome]    = useState('');
  const [tel,     setTel]     = useState('');
  const [limite,  setLimite]  = useState('');
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState('');

  const load = () => { setLoading(true); api.preCadastros().then(setLista).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const adicionar = async () => {
    if(!nome.trim()||tel.replace(/\D/g,'').length<11) return setMsg('❌ Nome e celular (11 dígitos) obrigatórios.');
    const lim = parseFloat(limite.replace(',','.'));
    if(!lim || lim <= 0) return setMsg('❌ Informe o limite de crédito.');
    setBusy(true); setMsg('');
    try {
      await api.addPreCadastro(tel, nome, lim);
      setNome(''); setTel(''); setLimite('');
      setMsg('✅ Adicionado com sucesso!');
      load(); setTimeout(()=>setMsg(''),3000);
    } catch(e){ setMsg('❌ '+e.message); }
    finally   { setBusy(false); }
  };

  const remover = async (id, nome) => {
    if(!window.confirm(`Excluir o pré-cadastro de "${nome}"?\n\nEsta ação não pode ser desfeita.`)) return;
    try {
      await api.removePreCadastro(id);
      load();
    } catch(e){ setMsg('❌ '+e.message); }
  };

  if(loading) return <Spinner/>;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <p style={S.title}>Pré-Cadastros</p>
        <p style={S.sub}>Apenas celulares listados aqui podem criar conta.</p>
      </div>

      <Card style={{marginBottom:20}}>
        <p style={S.formTitle}>+ Adicionar Celular</p>
        <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome do cliente" style={{marginBottom:10}}/>
        <input value={tel} onChange={e=>setTel(maskPhone(e.target.value))} placeholder="(92) 99999-9999" type="tel" inputMode="numeric" style={{marginBottom:10}}/>
        <div style={{position:'relative',marginBottom:12}}>
          <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:13,fontWeight:600,pointerEvents:'none'}}>R$</span>
          <input
            value={limite}
            onChange={e=>setLimite(e.target.value)}
            placeholder="Limite de crédito"
            type="number" inputMode="decimal" min="0" step="0.01"
            style={{paddingLeft:36}}
          />
        </div>
        {msg && <Alert type={msg.startsWith('✅')?'success':'error'}>{msg}</Alert>}
        <Btn onClick={adicionar} loading={busy}>Adicionar 💕</Btn>
      </Card>

      <p style={S.count}>{lista.length} número(s) cadastrado(s)</p>

      {lista.map(p=>(
        <Card key={p.id} style={S.item}>
          <div style={S.itemRow}>
            <span style={{fontSize:22,flexShrink:0}}>{p.cliente_id?'✅':'⏳'}</span>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{p.nome}</p>
              <p style={{color:'var(--muted)',fontSize:13}}>{maskPhone(p.telefone)}</p>
              {p.limite_credito > 0 && (
                <p style={{fontSize:12,color:'var(--pink)',fontWeight:700,marginTop:2}}>
                  Limite: {fmt(p.limite_credito)}
                </p>
              )}
            </div>
            <div style={{textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
              {p.cliente_id
                ? <span style={S.tagOk}>Cadastrado</span>
                : <span style={S.tagWait}>Aguardando</span>
              }
              <button onClick={()=>remover(p.id, p.nome)} style={S.removeBtn}>Excluir</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

const S = {
  wrap:     { padding:'0 16px 32px' },
  header:   { padding:'24px 0 20px' },
  title:    { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:'var(--text)' },
  sub:      { color:'var(--muted)', fontSize:13, marginTop:6, lineHeight:1.5 },
  formTitle:{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, marginBottom:14, color:'var(--text)' },
  count:    { color:'var(--muted)', fontSize:13, marginBottom:12, fontWeight:600 },
  item:     { marginBottom:10 },
  itemRow:  { display:'flex', alignItems:'center', gap:12 },
  tagOk:    { background:'#E8F5E9', color:'#2E7D32', border:'1.5px solid #A5D6A7', borderRadius:12, padding:'3px 10px', fontSize:11, fontWeight:700 },
  tagWait:  { background:'#FFF3E0', color:'#E65100', border:'1.5px solid #FFCC80', borderRadius:12, padding:'3px 10px', fontSize:11, fontWeight:700 },
  removeBtn:{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:12, marginTop:4, fontFamily:'inherit', fontWeight:600 },
};
