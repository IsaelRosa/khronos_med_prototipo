# 🚀 Getting Started - Setup & Testing Guide

## ⚡ Quick Start (5 minutos)

### 1️⃣ Verificar Pré-requisitos

```bash
# Node.js instalado?
node --version  # Deve ser v18+

# npm instalado?
npm --version   # Deve ser v8+

# PostgreSQL instalado?
psql --version  # Deve ter instalado
```

### 2️⃣ Iniciar Backend

```bash
# Terminal 1
cd backend
npm install
npm run dev
```

Espere por:
```
✅ Servidor rodando em http://localhost:3000
🗄️  Conectado ao banco de dados
📚 Documentação disponível
```

### 3️⃣ Iniciar Frontend

```bash
# Terminal 2 (na raiz do projeto)
npm install
npm run dev
```

Acesse: http://localhost:5173

---

## 🧪 Testing Checklist

### ✅ Autenticação

- [ ] Ir para http://localhost:5173/login
- [ ] Preencher credenciais:
  - Email: `teste@example.com`
  - Senha: `senha123`
- [ ] Clicar "Entrar"
- [ ] Deve redirecionar para `/painel`
- [ ] Avatar no canto superior direito com nome do usuário

**Se falhar:**
- [ ] Verificar console do navegador (F12)
- [ ] Verificar logs do backend
- [ ] Verificar se banco de dados está criado

---

### ✅ Listar Pacientes

- [ ] Clicar em "Pacientes" no menu
- [ ] Deve carregar lista (ou mostrar "Nenhum paciente")
- [ ] Se tiver pacientes, deve mostrar tabela com:
  - [ ] Nome
  - [ ] CPF
  - [ ] Idade
  - [ ] Contato
  - [ ] Convênio

**Se falhar:**
- [ ] Verificar se API está respondendo
- [ ] Verificar se banco de dados tem dados
- [ ] Ver Network tab (F12) para requisição GET /api/patients

---

### ✅ Criar Paciente

- [ ] Em "Pacientes", clique "Novo paciente"
- [ ] Preencha formulário:
  - [ ] Nome: "João Silva"
  - [ ] CPF: "123.456.789-00"
  - [ ] Data de Nascimento: "01/01/1990"
  - [ ] Telefone: "(11) 99999-9999"
  - [ ] Email: "joao@email.com"
  - [ ] Endereço: "Rua Exemplo, 123"
- [ ] Clique "Cadastrar paciente"
- [ ] Deve fechar modal
- [ ] Novo paciente deve aparecer na lista

**Se falhar:**
- [ ] Verificar se todos os campos obrigatórios estão preenchidos
- [ ] Ver Network tab para POST /api/patients
- [ ] Verificar resposta da API

---

### ✅ Visualizar Pacientes em Prontuários

- [ ] Clique em "Prontuários" no menu
- [ ] Deve mostrar lista de pacientes
- [ ] Clique em qualquer paciente → "Ver notas"
- [ ] Deve mudar aba para "Notas SOAP"

**Se falhar:**
- [ ] Verificar se tem pacientes cadastrados
- [ ] Ver logs do backend
- [ ] Verificar Network tab

---

## 🗄️ Database Setup

### Windows

```bash
# 1. Abrir pgAdmin 4 (instalado com PostgreSQL)
# 2. Conectar ao servidor local
# 3. Criar banco: khronos_med
# 4. Executar schema.sql
# 5. No terminal:

psql -U postgres -d khronos_med -f backend/schema.sql
```

### Linux/Mac

```bash
# 1. Conectar ao PostgreSQL
sudo -u postgres psql

# 2. Criar banco
CREATE DATABASE khronos_med;
\c khronos_med

# 3. Executar schema
\i backend/schema.sql

# 4. Testar
\dt  # Listar tabelas
SELECT COUNT(*) FROM users;  # Deve retornar 0
```

---

## 🔍 Verificar Conexão com BD

### Via pgAdmin
1. Abrir pgAdmin 4
2. Conectar ao servidor
3. Expandir "Databases"
4. Verificar se `khronos_med` existe
5. Expandir e ver tabelas

### Via Terminal
```bash
# Conectar
psql -U postgres -d khronos_med

# Ver tabelas
\dt

# Ver dados
SELECT * FROM users LIMIT 5;
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM soap_notes;
```

---

## 🔧 Configurar .env

### Backend (`backend/.env`)
```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/khronos_med
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Substituir:**
- `password` → senha do PostgreSQL
- `sua_chave_secreta_super_segura` → qualquer string segura

---

## 📊 Monitorar Requisições

### No navegador (F12)
1. Abrir DevTools
2. Ir para aba "Network"
3. Recarregar página
4. Ver todas as requisições para `localhost:3000`
5. Verificar status code (200 = sucesso, 4xx = erro)

### Ver JSON Response
1. Clique em qualquer requisição
2. Ir para aba "Response"
3. Ver JSON retornado

---

## 🐛 Logs & Debug

### Backend Logs
Terminal deve mostrar:
```
✅ Servidor rodando em http://localhost:3000
GET /api/patients 200
POST /api/patients 201
```

### Frontend Console (F12)
Deve estar limpo de erros. Se tiver vermelho:
```javascript
// Testar API manualmente
fetch('http://localhost:3000/api/patients', {
  headers: { 'Authorization': 'Bearer seu_token_aqui' }
})
.then(r => r.json())
.then(d => console.log(d))
```

---

## 🆘 Problemas Comuns

### "Cannot connect to backend"
✅ **Solução:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Verificar
curl http://localhost:3000/api/health
# Deve retornar: {"status":"ok"}
```

### "Invalid token"
✅ **Solução:**
```javascript
// No console do navegador
localStorage.clear()
// Recarregar página e fazer login novamente
```

### "Database connection failed"
✅ **Solução:**
```bash
# Verificar se PostgreSQL está rodando
# Windows: Services → PostgreSQL
# Linux: sudo systemctl status postgresql
# Mac: brew services list | grep postgresql

# Se não estiver, iniciar:
# Windows: Abrir pgAdmin ou PostgreSQL CLI
# Linux: sudo systemctl start postgresql
# Mac: brew services start postgresql@15
```

### "No such table: users"
✅ **Solução:**
```bash
# Executar schema
psql -U postgres -d khronos_med -f backend/schema.sql
# Verificar
psql -U postgres -d khronos_med -c "\dt"
```

---

## 📝 Verificação Final

| Item | Status | Verificar |
|------|--------|-----------|
| Node.js v18+ | ✅ | `node --version` |
| npm instalado | ✅ | `npm --version` |
| PostgreSQL rodando | ✅ | `psql --version` |
| Backend (port 3000) | ✅ | `npm run dev` em backend/ |
| Frontend (port 5173) | ✅ | `npm run dev` na raiz |
| Banco criado | ✅ | `psql -d khronos_med -c "\dt"` |
| Schema executado | ✅ | 4 tabelas devem existir |
| Login funcionando | ✅ | Fazer login em http://localhost:5173/login |
| Pacientes listando | ✅ | Ir em /pacientes após login |

---

## 🎉 Pronto!

Se tudo passou, você tem:
- ✅ Backend rodando em http://localhost:3000
- ✅ Frontend rodando em http://localhost:5173
- ✅ Banco de dados conectado
- ✅ Autenticação JWT funcionando
- ✅ API CRUD de pacientes funcionando
- ✅ Interface conectada ao backend

**Próximo passo:** Explorar as funcionalidades ou integrar mais endpoints!

---

## 📞 Suporte

Se tiver dúvidas:
1. Ver [DATABASE_SETUP.md](./backend/DATABASE_SETUP.md)
2. Ver [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
3. Ver [Backend README](./backend/README.md)
4. Verificar logs do terminal
5. Usar DevTools do navegador (F12)
