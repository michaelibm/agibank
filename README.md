# 🏦 AGIBANK

Sistema completo de microcrédito com controle de pré-cadastros, solicitações e aprovações.  
**Stack:** React (CRA) · Node.js + Express · PostgreSQL · Docker + Nginx

---

## 📁 Estrutura

```
agibank/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── migrations/
│   │   └── init.sql          ← Schema + dados iniciais
│   └── src/
│       ├── server.js
│       ├── db/pool.js
│       ├── middleware/auth.js
│       └── routes/
│           ├── auth.js
│           ├── emprestimos.js
│           └── admin.js
├── frontend/
│   ├── Dockerfile
│   ├── nginx-frontend.conf
│   ├── public/index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css
│       ├── services/api.js
│       ├── contexts/AuthContext.js
│       ├── components/UI.js
│       └── pages/
│           ├── Login.js
│           ├── PhoneCheck.js
│           ├── Register.js       ← 4 etapas + LGPD
│           ├── ClientLayout.js   ← Bottom nav mobile
│           ├── ClientHome.js
│           ├── Solicitar.js
│           ├── MeusEmprestimos.js
│           ├── Perfil.js
│           ├── AdminLayout.js
│           ├── AdminDashboard.js
│           ├── AdminSolicitacoes.js
│           ├── AdminClientes.js
│           └── PreCadastros.js
└── nginx/
    └── nginx.conf
```

---

## 🚀 Deploy com Docker

### 1. Clonar e configurar

```bash
# Editar variáveis de ambiente (opcional)
cp .env .env.local
nano .env
```

### 2. Subir todos os serviços

```bash
docker-compose up -d --build
```

### 3. Acessar

| Serviço    | URL                  |
|------------|----------------------|
| App        | http://localhost     |
| API        | http://localhost/api |
| PostgreSQL | localhost:5432       |

---

## 🔑 Credenciais de Demo

| Tipo  | Login   | Senha     |
|-------|---------|-----------|
| Admin | `admin` | `admin123`|

**Celulares pré-cadastrados para teste:**
- `(92) 99123-4567` → Ana Souza
- `(92) 99876-5432` → Carlos Lima
- `(92) 99456-1230` → Fernanda Costa
- `(92) 99321-4567` → Roberto Alves

---

## ✅ Funcionalidades

### Cliente
- ✅ Verificação de celular pré-cadastrado
- ✅ Cadastro completo em 4 etapas (Dados, Endereço, Pix, LGPD)
- ✅ Termo de consentimento LGPD com scroll obrigatório
- ✅ Login por celular + senha
- ✅ Solicitação de crédito (R$100 – R$50.000)
- ✅ Simulação automática: valor + 30% de juros
- ✅ Prazo de 30 dias com barra de progresso
- ✅ Status em tempo real: Em Análise / Aprovado / Reprovado
- ✅ Histórico completo de empréstimos
- ✅ Visualização de vencimentos com alerta de urgência

### Administrador
- ✅ Dashboard com métricas e volume total
- ✅ Gerenciamento de pré-cadastros de celular
- ✅ Lista de clientes com dados completos
- ✅ Aprovação / Reprovação de solicitações com observação
- ✅ Filtros por status das solicitações

### Segurança / Compliance
- ✅ Senhas com bcrypt (salt 10)
- ✅ JWT (7 dias de expiração)
- ✅ Rate limiting nas rotas de auth
- ✅ Helmet.js para headers de segurança
- ✅ Registro de data/hora do aceite LGPD
- ✅ Validação de CPF único, e-mail único, telefone único

---

## 🛠 Comandos úteis

```bash
# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar apenas o backend
docker-compose restart backend

# Acessar banco de dados
docker exec -it agibank_db psql -U agibank -d agibank

# Parar tudo
docker-compose down

# Parar e apagar dados
docker-compose down -v
```

---

## 🗄 Banco de Dados

Tabelas principais:
- `pre_cadastros` — celulares autorizados pelo admin
- `clientes` — dados completos + LGPD
- `emprestimos` — solicitações com status e vencimento
- `administradores` — usuários admin
- `logs_acesso` — auditoria

---

## 📱 Mobile-First

A interface é totalmente responsiva e otimizada para mobile:
- `100dvh` para respeitar safe area do iOS
- Bottom navigation fixo
- Inputs com `inputMode` correto para teclado numérico
- Touch feedback em botões
- Scroll suave com `-webkit-overflow-scrolling: touch`
