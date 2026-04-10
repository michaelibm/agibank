const BASE = process.env.REACT_APP_API_URL || '/api';

const getToken = () => localStorage.getItem('agibank_token');
const getSlug  = () => localStorage.getItem('agibank_slug') || 'agibank';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido.');
  return data;
};

export const api = {
  // ── Auth
  verificarTelefone: (telefone, empresa_slug) =>
    req('POST', '/auth/verificar-telefone', { telefone, empresa_slug }),
  cadastrar: (form) =>
    req('POST', '/auth/cadastrar', { ...form, empresa_slug: getSlug() }),
  login: (cpf, senha) =>
    req('POST', '/auth/login', { cpf, senha, empresa_slug: getSlug() }),
  adminLogin: (login, senha, empresa_slug) =>
    req('POST', '/auth/admin/login', { login, senha, empresa_slug: empresa_slug || getSlug() }),
  superAdminLogin: (login, senha) =>
    req('POST', '/auth/superadmin/login', { login, senha }),
  me: () => req('GET', '/auth/me'),

  // ── Empréstimos (cliente)
  meus:     ()      => req('GET',  '/emprestimos'),
  solicitar: (valor, termo_texto) => req('POST', '/emprestimos', { valor, termo_texto }),

  // ── Admin
  dashboard:       () => req('GET', '/admin/dashboard'),
  adminEmprestimos:() => req('GET', '/admin/emprestimos'),
  decidir:  (id, decisao, observacao) =>
    req('PATCH', `/admin/emprestimos/${id}/decidir`, { decisao, observacao }),
  marcarPago:       (id)      => req('PATCH', `/admin/emprestimos/${id}/pago`,       {}),
  pagarJuros:       (id)      => req('PATCH', `/admin/emprestimos/${id}/renovar`,    {}),
  editarVencimento: (id,data) => req('PATCH', `/admin/emprestimos/${id}/vencimento`, data),
  avisarCliente:    (id)      => req('POST',  `/admin/emprestimos/${id}/avisar`,     {}),
  prazos:           ()        => req('GET',   '/admin/prazos'),
  adminClientes:      ()        => req('GET',   '/admin/clientes'),
  criarCliente:       (data)    => req('POST',  '/admin/clientes', data),
  editarCliente:      (id,data) => req('PATCH',  `/admin/clientes/${id}`, data),
  excluirCliente:     (id)      => req('DELETE', `/admin/clientes/${id}`),
  preCadastros:    () => req('GET', '/admin/pre-cadastros'),
  addPreCadastro:  (telefone, nome, limite_credito) => req('POST', '/admin/pre-cadastros', { telefone, nome, limite_credito }),
  removePreCadastro:(id) => req('DELETE', `/admin/pre-cadastros/${id}`),
  caixa:           ()               => req('GET',  '/admin/caixa'),
  caixaMovimento:  (tipo,valor,descricao) => req('POST',  '/admin/caixa', { tipo, valor, descricao }),
  caixaCancelar:   (id, motivo)          => req('PATCH', `/admin/caixa/${id}/cancelar`, { motivo }),

  // ── Usuários admin
  usuarios:       ()          => req('GET',    '/admin/usuarios'),
  criarUsuario:   (data)      => req('POST',   '/admin/usuarios', data),
  editarUsuario:  (id, data)  => req('PATCH',  `/admin/usuarios/${id}`, data),
  excluirUsuario: (id)        => req('DELETE', `/admin/usuarios/${id}`),

  // ── Super Admin
  saStats:   ()    => req('GET',  '/superadmin/stats'),
  saEmpresas:()    => req('GET',  '/superadmin/empresas'),
  saCriarEmpresa:(data) => req('POST', '/superadmin/empresas', data),
  saToggleEmpresa:(id, ativo) => req('PATCH', `/superadmin/empresas/${id}`, { ativo }),
  saUpdateEmpresa:(id, data)  => req('PATCH', `/superadmin/empresas/${id}`, data),
};
