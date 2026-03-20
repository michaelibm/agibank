import { useState } from 'react';
import { Logo, Btn, Card, Field, Alert, maskPhone, Dots } from '../components/UI';
import { api } from '../services/api';

export default function PhoneCheck({ onFound, onLogin }) {
  const [phone,   setPhone]   = useState('');
  const [slug,    setSlug]    = useState(localStorage.getItem('agibank_slug')||'agibank');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const check = async () => {
    const clean = phone.replace(/\D/g,'');
    if (clean.length < 10) return setErr('Digite um número de celular válido.');
    if (!slug.trim()) return setErr('Informe o código da empresa.');
    setLoading(true); setErr('');
    try {
      localStorage.setItem('agibank_slug', slug);
      const data = await api.verificarTelefone(clean, slug);
      onFound({ telefone: clean, nome: data.nome, empresa_slug: slug });
    } catch(e){ setErr(e.message); }
    finally   { setLoading(false); }
  };

  return (
    <div style={S.wrap}>
      <Dots/>
      <div style={S.inner}>
        <div style={S.hero}>
          <div style={S.logoBox}><Logo/></div>
          <h1 style={S.heroTitle}>Primeiro Acesso 🌸</h1>
          <p style={S.heroSub}>Verifique seu número para criar sua conta</p>
        </div>

        <Card style={S.card}>
          <div style={{fontSize:40,textAlign:'center',marginBottom:16}}>📱</div>
          <Field label="Código da Empresa">
            <input value={slug} onChange={e=>{setSlug(e.target.value.toLowerCase());setErr('');}}
              placeholder="ex: agibank" autoCapitalize="none"/>
          </Field>
          <Field label="Seu Celular">
            <input value={phone} onChange={e=>{setPhone(maskPhone(e.target.value));setErr('');}}
              placeholder="(92) 99999-9999" type="tel" inputMode="numeric"
              style={{textAlign:'center',fontSize:18,fontWeight:700,letterSpacing:1}}/>
          </Field>
          {err && <Alert type="error">{err}</Alert>}
          <Btn onClick={check} loading={loading}>Verificar Número 💕</Btn>
          <div style={S.divRow}><span style={S.line}/><span style={S.or}>ou</span><span style={S.line}/></div>
          <Btn variant="ghost" onClick={onLogin}>Já tenho conta → Entrar</Btn>
        </Card>
        <div style={S.note}>🔒 Apenas números pré-cadastrados pelo administrador podem criar conta.</div>
      </div>
    </div>
  );
}

const S = {
  wrap:      { minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',position:'relative',overflow:'hidden' },
  inner:     { width:'100%',maxWidth:400,position:'relative',zIndex:1 },
  hero:      { textAlign:'center',marginBottom:24 },
  logoBox:   { display:'inline-flex',background:'#fff',borderRadius:20,padding:'12px 22px',boxShadow:'0 8px 32px rgba(233,30,140,.15)',marginBottom:16 },
  heroTitle: { fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:26,color:'var(--text)',marginBottom:8 },
  heroSub:   { color:'var(--muted)',fontSize:14 },
  card:      { padding:28 },
  divRow:    { display:'flex',alignItems:'center',gap:12,margin:'18px 0' },
  line:      { flex:1,height:1,background:'var(--border)',display:'block' },
  or:        { color:'var(--muted)',fontSize:12,fontWeight:600 },
  note:      { textAlign:'center',color:'var(--muted)',fontSize:12,marginTop:20,lineHeight:1.6,padding:'0 10px' },
};
