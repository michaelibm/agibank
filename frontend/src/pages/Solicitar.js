import { useState } from 'react';
import { Btn, Card, Alert, fmt } from '../components/UI';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Solicitar({ onDone }) {
  const { user } = useAuth();
  const [cents,   setCents]   = useState('');
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(false);

  const valor = parseInt(cents||'0')/100;
  const juros = +(valor*.30).toFixed(2);
  const total = +(valor*1.30).toFixed(2);

  const handleInput = e => { setCents(e.target.value.replace(/\D/g,'')); setErr(''); setOk(''); };

  const abrirTermo = () => {
    if(valor<100)   return setErr('Valor mínimo: R$ 100,00.');
    if(valor>50000) return setErr('Valor máximo: R$ 50.000,00.');
    setErr('');
    setModal(true);
  };

  const confirmar = async () => {
    setLoading(true); setErr('');
    const termoTexto =
      `Eu, ${user?.nome||''}, CPF ${cpfFormatado}, declaro que aceito os termos do Agibank. ` +
      `Concordo em receber o valor solicitado de ${fmt(valor)}, sujeito a uma taxa de 30% sobre o valor. ` +
      `O valor total a ser devolvido será de ${fmt(total)}, com prazo de 30 dias a partir da aprovação. ` +
      `Estou ciente e de acordo com as condições apresentadas e confirmo a contratação.`;
    try {
      await api.solicitar(valor, termoTexto);
      setModal(false);
      setOk('✅ Solicitação enviada! Aguarde análise.');
      setCents('');
      setTimeout(onDone, 2500);
    } catch(e){ setErr(e.message); setModal(false); }
    finally   { setLoading(false); }
  };

  const cpfFormatado = (user?.cpf||'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <p style={S.headerTitle}>Solicitar Crédito 💰</p>
        <p style={S.headerSub}>Simule e solicite em segundos</p>
      </div>

      <Card style={S.main}>
        <p style={S.label}>Quanto você precisa?</p>
        <div style={S.inputWrap}>
          <span style={S.rs}>R$</span>
          <input
            value={valor>0?valor.toLocaleString('pt-BR',{minimumFractionDigits:2}):''}
            onChange={handleInput}
            placeholder="0,00"
            inputMode="numeric"
            style={S.bigInput}
          />
        </div>
        <input type="range" min="0" max="5000000" step="10000"
          value={parseInt(cents||'0')}
          onChange={e=>{setCents(e.target.value);setErr('');setOk('');}}
          style={S.slider}
        />
        <div style={S.sliderLabels}><span>R$ 100</span><span>R$ 50.000</span></div>
      </Card>

      {/* Simulação */}
      {valor>=100 && (
        <Card style={S.sim}>
          <p style={S.simTitle}>🌸 Simulação</p>
          <div style={S.simRow}>
            <span style={{color:'var(--muted)'}}>Valor solicitado</span>
            <span style={{fontWeight:700}}>{fmt(valor)}</span>
          </div>
          <div style={S.simRow}>
            <span style={{color:'var(--muted)'}}>Juros (30%)</span>
            <span style={{color:'var(--peach)',fontWeight:700}}>+ {fmt(juros)}</span>
          </div>
          <div style={{...S.simRow,...S.simTotal}}>
            <span style={{fontWeight:800}}>Total em 30 dias</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:'var(--pink)'}}>{fmt(total)}</span>
          </div>
          <div style={S.prazo}>
            <span style={{fontSize:22}}>📅</span>
            <div>
              <p style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>30 dias para pagar</p>
              <p style={{color:'var(--muted)',fontSize:12}}>A partir da data de aprovação</p>
            </div>
          </div>
        </Card>
      )}

      {err && <Alert type="error">{err}</Alert>}
      {ok  && <Alert type="success">{ok}</Alert>}

      <Btn onClick={abrirTermo} loading={loading} disabled={valor<100}>
        Enviar Solicitação 💗
      </Btn>

      <p style={S.info}>
        🔒 Após aprovação você terá 30 dias para pagar com acréscimo de 30% sobre o valor solicitado.
      </p>

      {/* Modal de Termo */}
      {modal && (
        <div style={S.overlay}>
          <div style={S.modalBox}>
            <h3 style={S.modalTitle}>📋 Termo de Contratação</h3>
            <div style={S.termoBox}>
              <p style={S.termoText}>
                Eu, <strong>{user?.nome||'Cliente'}</strong>, CPF <strong>{cpfFormatado}</strong>,
                declaro que aceito os termos do Agibank.
              </p>
              <p style={S.termoText}>
                Concordo em receber o valor solicitado de <strong>{fmt(valor)}</strong>,
                sujeito a uma taxa de <strong>30%</strong> sobre o valor.
              </p>
              <p style={S.termoText}>
                O valor total a ser devolvido será de <strong>{fmt(total)}</strong>,
                com prazo de <strong>30 dias</strong> a partir da aprovação.
              </p>
              <p style={S.termoText}>
                Estou ciente e de acordo com as condições apresentadas e confirmo a contratação.
              </p>
            </div>
            <div style={S.modalBtns}>
              <button onClick={()=>setModal(false)} style={S.cancelBtn}>Cancelar</button>
              <Btn onClick={confirmar} loading={loading} style={{flex:1}}>
                Confirmar e Assinar ✅
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap:        { padding:'0 16px 32px' },
  header:      { padding:'24px 0 20px' },
  headerTitle: { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:26, color:'var(--text)' },
  headerSub:   { color:'var(--muted)', fontSize:14, marginTop:4 },
  main:        { marginBottom:14 },
  label:       { color:'var(--pink)', fontSize:12, marginBottom:12, textTransform:'uppercase', letterSpacing:.6, fontWeight:700 },
  inputWrap:   { display:'flex', alignItems:'center', gap:8, marginBottom:16 },
  rs:          { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:'var(--muted)' },
  bigInput:    { border:'none', background:'none', color:'var(--text)', fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:34, flex:1, outline:'none', width:'100%' },
  slider:      { width:'100%', accentColor:'var(--pink)', cursor:'pointer', marginBottom:6 },
  sliderLabels:{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', fontWeight:600 },
  sim:         { marginBottom:16 },
  simTitle:    { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, marginBottom:14 },
  simRow:      { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border2)' },
  simTotal:    { borderBottom:'none', marginTop:4, paddingTop:14 },
  prazo:       { display:'flex', alignItems:'center', gap:12, background:'var(--pink-pale)', borderRadius:'var(--radius-sm)', padding:14, marginTop:14 },
  info:        { textAlign:'center', color:'var(--muted)', fontSize:12, marginTop:16, lineHeight:1.7 },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modalBox:    { background:'#fff', borderRadius:20, padding:'28px 24px', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.25)', maxHeight:'90dvh', overflowY:'auto' },
  modalTitle:  { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'var(--text)', marginBottom:20, textAlign:'center' },
  termoBox:    { background:'#FFF8F9', border:'1.5px solid var(--border)', borderRadius:12, padding:'18px 16px', marginBottom:24, display:'flex', flexDirection:'column', gap:14 },
  termoText:   { fontSize:14, color:'var(--text)', lineHeight:1.8, margin:0 },
  modalBtns:   { display:'flex', gap:10, alignItems:'stretch' },
  cancelBtn:   { flex:1, background:'none', border:'1.5px solid var(--border)', borderRadius:14, padding:'13px 8px', fontSize:14, fontFamily:'inherit', fontWeight:700, color:'var(--muted)', cursor:'pointer' },
};
