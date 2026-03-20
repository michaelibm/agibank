import { useState } from 'react';
import { Logo, Btn, Card, Field, Alert, maskCPF, maskPhone, maskCEP } from '../components/UI';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STEPS = [
  { label:'Dados', icon:'👤' },
  { label:'Endereço', icon:'🏠' },
  { label:'Pix & Senha', icon:'💳' },
  { label:'LGPD', icon:'📋' },
];

export default function Register({ preData, onBack }) {
  const { loginCliente } = useAuth();
  const [step,    setStep]    = useState(0);
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome:preData.nome, telefone:preData.telefone,
    cpf:'', rg:'', email:'',
    cep:'', rua:'', numero:'', bairro:'', cidade:'', estado:'',
    pix_tipo:'cpf', pix_chave:'',
    senha:'', senha2:'',
    lgpd:false,
  });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const validate = () => {
    if (step===0) {
      if (form.cpf.replace(/\D/g,'').length<11) return 'CPF inválido.';
      if (!form.rg.trim()) return 'RG obrigatório.';
      if (!form.email.includes('@')) return 'E-mail inválido.';
      if (!form.nome.trim()) return 'Nome obrigatório.';
    }
    if (step===1) {
      if (!form.rua||!form.numero||!form.bairro||!form.cidade||!form.estado)
        return 'Preencha todos os campos de endereço.';
    }
    if (step===2) {
      if (!form.pix_chave.trim()) return 'Informe a chave Pix.';
      if (form.senha.length<6) return 'Senha deve ter no mínimo 6 caracteres.';
      if (form.senha!==form.senha2) return 'As senhas não conferem.';
    }
    if (step===3 && !form.lgpd) return 'Você deve aceitar o Termo LGPD para continuar.';
    return null;
  };

  const next = () => {
    const e=validate(); if(e){setErr(e);return;} setErr(''); setStep(s=>s+1);
  };

  const submit = async () => {
    const e=validate(); if(e){setErr(e);return;}
    setLoading(true); setErr('');
    try {
      const payload={...form,empresa_slug:preData.empresa_slug||localStorage.getItem("agibank_slug")||"agibank",cpf:form.cpf.replace(/\D/g,''),cep:form.cep.replace(/\D/g,'')};
      const data=await api.cadastrar(payload);
      localStorage.setItem('agibank_token',data.token);
      await loginCliente(null,null,data);
      window.location.reload();
    } catch(ex){ setErr(ex.message); }
    finally    { setLoading(false); }
  };

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        {/* Header */}
        <div style={S.topBar}>
          <Logo size="sm"/>
          <button onClick={onBack} style={S.backBtn}>← Voltar</button>
        </div>

        {/* Steps */}
        <div style={S.steps}>
          {STEPS.map((s,i)=>(
            <div key={i} style={S.stepItem}>
              <div style={{
                ...S.stepCircle,
                background: i<step?'var(--pink)':i===step?'linear-gradient(135deg,#E91E8C,#F06292)':'var(--bg2)',
                color: i<=step?'#fff':'var(--muted)',
                boxShadow: i===step?'0 4px 14px rgba(233,30,140,.4)':'none',
              }}>
                {i<step?'✓':s.icon}
              </div>
              <p style={{...S.stepLabel, color:i<=step?'var(--pink)':'var(--muted)'}}>{s.label}</p>
            </div>
          ))}
        </div>

        <Card style={S.card}>
          <h2 style={S.cardTitle}>{STEPS[step].label} {STEPS[step].icon}</h2>

          {step===0 && (
            <>
              <Field label="Nome Completo">
                <input value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Seu nome completo" />
              </Field>
              <Field label="Celular">
                <input value={maskPhone(form.telefone)} disabled style={{opacity:.6,background:'var(--bg2)'}} />
              </Field>
              <div style={S.grid2}>
                <Field label="CPF">
                  <input value={form.cpf} onChange={e=>set('cpf',maskCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric"/>
                </Field>
                <Field label="RG">
                  <input value={form.rg} onChange={e=>set('rg',e.target.value)} placeholder="0000000-0"/>
                </Field>
              </div>
              <Field label="E-mail">
                <input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="seu@email.com" type="email" inputMode="email"/>
              </Field>
            </>
          )}

          {step===1 && (
            <>
              <div style={S.grid2}>
                <Field label="CEP">
                  <input value={form.cep} onChange={e=>set('cep',maskCEP(e.target.value))} placeholder="00000-000" inputMode="numeric"/>
                </Field>
                <Field label="Número">
                  <input value={form.numero} onChange={e=>set('numero',e.target.value)} placeholder="123"/>
                </Field>
              </div>
              <Field label="Rua / Logradouro">
                <input value={form.rua} onChange={e=>set('rua',e.target.value)} placeholder="Rua das Flores"/>
              </Field>
              <Field label="Bairro">
                <input value={form.bairro} onChange={e=>set('bairro',e.target.value)} placeholder="Centro"/>
              </Field>
              <div style={S.grid2}>
                <Field label="Cidade">
                  <input value={form.cidade} onChange={e=>set('cidade',e.target.value)} placeholder="Manaus"/>
                </Field>
                <Field label="UF">
                  <input value={form.estado} onChange={e=>set('estado',e.target.value.toUpperCase().slice(0,2))} placeholder="AM"/>
                </Field>
              </div>
            </>
          )}

          {step===2 && (
            <>
              <div style={S.grid2}>
                <Field label="Tipo Pix">
                  <select value={form.pix_tipo} onChange={e=>set('pix_tipo',e.target.value)}>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </Field>
                <Field label="Chave Pix">
                  <input value={form.pix_chave} onChange={e=>set('pix_chave',e.target.value)} placeholder="Sua chave"/>
                </Field>
              </div>
              <Field label="Senha">
                <input type="password" value={form.senha} onChange={e=>set('senha',e.target.value)} placeholder="Mínimo 6 caracteres"/>
              </Field>
              <Field label="Confirmar Senha">
                <input type="password" value={form.senha2} onChange={e=>set('senha2',e.target.value)} placeholder="Repita a senha"/>
              </Field>
            </>
          )}

          {step===3 && (
            <div>
              <div style={S.lgpdScroll}>
                <h3 style={S.lgpdTitle}>Termo de Consentimento — LGPD 📋</h3>
                <p style={S.lgpdText}><strong>1. Finalidade do Tratamento</strong><br/>
                A AGIBANK coleta seus dados pessoais (CPF, RG, endereço, e-mail, telefone e chave Pix) para análise de crédito, formalização de contratos e comunicações, nos termos da Lei 13.709/2018 (LGPD).</p>
                <p style={S.lgpdText}><strong>2. Base Legal</strong><br/>
                O tratamento baseia-se no consentimento do titular (art. 7º, I, LGPD) e na execução de contrato (art. 7º, V).</p>
                <p style={S.lgpdText}><strong>3. Compartilhamento</strong><br/>
                Dados poderão ser compartilhados com órgãos de proteção ao crédito e autoridades regulatórias quando exigido por lei. Não vendemos seus dados a terceiros.</p>
                <p style={S.lgpdText}><strong>4. Seus Direitos</strong><br/>
                Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pelo canal oficial da AGIBANK.</p>
                <p style={S.lgpdText}><strong>5. Segurança</strong><br/>
                Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado.</p>
                <p style={S.lgpdText}><strong>6. Retenção</strong><br/>
                Dados mantidos pelo período legal necessário, incluindo obrigações contábeis e fiscais (mínimo 5 anos).</p>
                <p style={{...S.lgpdText,marginBottom:0}}>Ao aceitar, você declara ter lido e concordado com todas as condições acima.</p>
              </div>
              <label style={S.checkLabel} onClick={()=>set('lgpd',!form.lgpd)}>
                <div style={{
                  ...S.checkbox,
                  borderColor:form.lgpd?'var(--pink)':'var(--border)',
                  background:form.lgpd?'linear-gradient(135deg,#E91E8C,#F06292)':'#fff',
                  boxShadow:form.lgpd?'0 4px 12px rgba(233,30,140,.3)':'none',
                }}>
                  {form.lgpd && <span style={{color:'#fff',fontSize:13,fontWeight:800}}>✓</span>}
                </div>
                <span style={{fontSize:13,color:'var(--text2)',lineHeight:1.5}}>
                  Li e aceito os Termos de Consentimento e a Política de Privacidade da AGIBANK conforme a LGPD. 💕
                </span>
              </label>
            </div>
          )}

          {err && <Alert type="error">{err}</Alert>}

          <div style={S.navRow}>
            {step>0
              ? <Btn variant="ghost" onClick={()=>{setErr('');setStep(s=>s-1);}} style={{flex:1}}>← Anterior</Btn>
              : <div/>
            }
            {step<3
              ? <Btn onClick={next} style={{flex:2}}>Próximo →</Btn>
              : <Btn variant="success" onClick={submit} loading={loading} style={{flex:2}}>✓ Criar Conta 🌸</Btn>
            }
          </div>
        </Card>
      </div>
    </div>
  );
}

const S = {
  wrap:       { minHeight:'100dvh', padding:'16px', overflowY:'auto', background:'var(--bg)' },
  inner:      { maxWidth:520, margin:'0 auto' },
  topBar:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  backBtn:    { background:'none', border:'none', color:'var(--pink)', cursor:'pointer', fontSize:14, fontFamily:'inherit', fontWeight:600 },
  steps:      { display:'flex', justifyContent:'space-between', marginBottom:20, padding:'0 4px' },
  stepItem:   { display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 },
  stepCircle: { width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all .3s', fontWeight:700 },
  stepLabel:  { fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:.3, transition:'color .3s' },
  card:       { padding:22 },
  cardTitle:  { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'var(--text)', marginBottom:20 },
  grid2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  lgpdScroll: { background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:16, height:240, overflowY:'auto', marginBottom:18, border:'1.5px solid var(--border)' },
  lgpdTitle:  { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, marginBottom:14, color:'var(--text)' },
  lgpdText:   { fontSize:12, color:'var(--text2)', lineHeight:1.7, marginBottom:12 },
  checkLabel: { display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer', userSelect:'none' },
  checkbox:   { width:24, height:24, borderRadius:8, border:'2px solid', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s', marginTop:1 },
  navRow:     { display:'flex', gap:10, marginTop:20 },
};
