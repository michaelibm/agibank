import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PhoneCheck      from './pages/PhoneCheck';
import Register        from './pages/Register';
import Login           from './pages/Login';
import ClientLayout    from './pages/ClientLayout';
import AdminLayout     from './pages/AdminLayout';
import SuperAdminLayout from './pages/SuperAdminLayout';
import { Spinner }     from './components/UI';
import './index.css';

function AppInner() {
  const { user, role, loading } = useAuth();
  const [screen,  setScreen]  = useState('login');
  const [preData, setPreData] = useState(null);

  if (loading) return (
    <div style={{ minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:28,marginBottom:24,background:'linear-gradient(135deg,#E91E8C,#AD1457)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
          Agi<em>bank</em>
        </div>
        <Spinner/>
      </div>
    </div>
  );

  if (user) {
    if (role === 'superadmin') return <SuperAdminLayout/>;
    if (role === 'admin')      return <AdminLayout/>;
    if (role === 'cliente')    return <ClientLayout/>;
  }

  if (screen === 'phoneCheck') return (
    <PhoneCheck
      onFound={pre => { setPreData(pre); setScreen('register'); }}
      onLogin={() => setScreen('login')}
    />
  );

  if (screen === 'register' && preData) return (
    <Register preData={preData} onBack={() => setScreen('login')}/>
  );

  return <Login onRegister={() => setScreen('phoneCheck')}/>;
}

export default function App() {
  return <AuthProvider><AppInner/></AuthProvider>;
}
