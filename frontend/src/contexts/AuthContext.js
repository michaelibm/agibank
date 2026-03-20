import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('agibank_token');
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.me();
      setUser(data);
      setRole(data.role);
    } catch {
      localStorage.removeItem('agibank_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const loginCliente = async (cpf, senha, directData) => {
    if (directData) { await loadMe(); return; }
    const data = await api.login(cpf, senha);
    localStorage.setItem('agibank_token', data.token);
    setUser({ ...data.cliente, role: 'cliente' });
    setRole('cliente');
    return data;
  };

  const loginAdmin = async (login, senha, empresa_slug) => {
    const data = await api.adminLogin(login, senha, empresa_slug);
    localStorage.setItem('agibank_token', data.token);
    if (empresa_slug) localStorage.setItem('agibank_slug', empresa_slug);
    setUser({ ...data.admin, ...data.empresa, role: 'admin' });
    setRole('admin');
    return data;
  };

  const loginSuperAdmin = async (login, senha) => {
    const data = await api.superAdminLogin(login, senha);
    localStorage.setItem('agibank_token', data.token);
    setUser({ ...data.superadmin, role: 'superadmin' });
    setRole('superadmin');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('agibank_token');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginCliente, loginAdmin, loginSuperAdmin, logout, reloadUser: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
