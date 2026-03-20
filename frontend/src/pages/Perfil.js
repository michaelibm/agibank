import { Card, Btn, fmtDate, maskPhone } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';

export default function Perfil() {
  const { user, logout } = useAuth();
  if(!user) return null;

  const rows = [
    { l:'Nome',        v:user.nome },
    { l:'CPF',         v:user.cpf },
    { l:'RG',          v:user.rg },
    { l:'E-mail',      v:user.email },
    { l:'Celular',     v:maskPhone(user.telefone||'') },
    { l:'Endereço',    v:user.rua?`${user.rua}, ${user.numero} — ${user.bairro}, ${user.cidade}/${user.estado}`:'—' },
    { l:'Chave Pix',   v:user.pix_tipo?`${user.pix_tipo.toUpperCase()}: ${user.pix_chave}`:'—' },
    { l:'LGPD',        v:user.lgpd_aceito?'✅ Termo aceito':'—', color:user.lgpd_aceito?'var(--green)':undefined },
    { l:'Membro desde',v:user.criado_em?fmtDate(user.criado_em):'—' },
  ];

  return (
    <div style={S.wrap}>
      {/* Avatar */}
      <div style={S.avatarSection}>
        <div style={S.avatarRing}>
          <div style={S.avatar}>{user.nome?.[0]?.toUpperCase()}</div>
        </div>
        <p style={S.name}>{user.nome}</p>
        <p style={S.email}>{user.email}</p>
        <div style={S.badge}>✨ Cliente AGIBANK</div>
      </div>

      <Card style={{marginBottom:16}}>
        {rows.map(({l,v,color})=>(
          <div key={l} style={S.row}>
            <span style={S.rowLabel}>{l}</span>
            <span style={{...S.rowVal,...(color?{color}:{})}}>{v}</span>
          </div>
        ))}
      </Card>

      <Btn variant="ghost" onClick={logout} style={{borderColor:'var(--red)',color:'var(--red)'}}>
        Sair da Conta
      </Btn>
    </div>
  );
}

const S = {
  wrap:          { padding:'0 16px 32px' },
  avatarSection: { textAlign:'center', padding:'28px 0 20px' },
  avatarRing:    { display:'inline-block', padding:4, borderRadius:'50%', background:'linear-gradient(135deg,#E91E8C,#F48FB1)', marginBottom:12, boxShadow:'0 8px 24px rgba(233,30,140,.3)' },
  avatar:        { width:72, height:72, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:28, color:'var(--pink)' },
  name:          { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:'var(--text)' },
  email:         { color:'var(--muted)', fontSize:13, marginTop:4 },
  badge:         { display:'inline-block', background:'linear-gradient(135deg,#FCE4EC,#F8BBD9)', color:'var(--pink)', border:'1.5px solid var(--border)', borderRadius:20, padding:'5px 16px', fontSize:12, fontWeight:700, marginTop:10 },
  row:           { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border2)', gap:12 },
  rowLabel:      { color:'var(--muted)', fontSize:13, flexShrink:0, fontWeight:600 },
  rowVal:        { fontSize:13, fontWeight:600, textAlign:'right', wordBreak:'break-all', maxWidth:'60%', color:'var(--text)' },
};
