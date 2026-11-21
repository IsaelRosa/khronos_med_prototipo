# 🚀 Khronos Med - Guia Completo de Setup e Uso

## ✅ Fase 1: Configuração do Banco de Dados - CONCLUÍDA

### Status: 🟢 PRODUÇÃO

**Componentes em Execução:**
1. ✅ PostgreSQL (Docker) - Porta 5432
2. ✅ Backend Node.js - Porta 3000
3. ✅ Frontend React - Porta 5173

---

## 📋 Instruções de Uso

### 1️⃣ Iniciar os Serviços

#### Terminal 1: Backend
```bash
cd backend
npm run dev
# ou se já compilado
npm start
```
**Output esperado:**
```
🚀 Server running on http://localhost:3000
📚 API Documentation:
   - POST   /api/auth/register - Register new user
   - POST   /api/auth/login - Login
   ...
```

#### Terminal 2: Frontend
```bash
npm run dev
```
**Output esperado:**
```
VITE v... ready in ... ms
➜  Local:   http://localhost:5173/
➜  press h to show help
```

#### Terminal 3: Docker (se necessário)
```bash
# Verificar status
docker ps

# Se PostgreSQL não estiver rodando
docker start professor-em-movimento-postgres
```

---

### 2️⃣ Testar Autenticação

#### Via Browser
1. Acesse: `http://localhost:5173/login`
2. Preencha as credenciais de teste:
   - **Email**: `novo@khronos.com`
   - **Senha**: `senha123`
3. Clique em "Entrar"
4. Deve redirecionar para `/painel`

#### Via API (PowerShell/Bash)

**Registrar novo usuário:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@khronos.com",
    "password": "senha123",
    "name": "Usuário Teste",
    "role": "medico"
  }'
```

**Fazer login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo@khronos.com",
    "password": "senha123"
  }'
```

**Resposta (copie o token):**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": "...",
    "email": "novo@khronos.com",
    "name": "Novo Usuário",
    "role": "medico"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Usar o token para acessar recurso protegido:**
```bash
curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer <seu_token_aqui>"
```

---

### 3️⃣ Testar Funcionalidades

#### Dashboard
✅ Acesse `/painel` - Deve mostrar dashboard

#### Pacientes
✅ Acesse `/pacientes` - Deve listar 3 pacientes de teste:
- PAC001 - João Silva
- PAC002 - Maria Santos
- PAC003 - Pedro Costa

**Criar novo paciente:**
1. Clique em "+" ou "Novo paciente"
2. Preencha dados:
   - Nome completo
   - CPF
   - Data de nascimento
   - Sexo
   - Telefone
   - E-mail
   - Endereço
   - Convênio (opcional)
3. Clique "Cadastrar paciente"
4. Deve aparecer na lista

#### Notas SOAP
⏳ Em desenvolvimento - Endpoints criados, UI em construção

#### Agendamentos
⏳ Em desenvolvimento - Endpoints criados, UI em construção

#### Prescrições
⏳ Em desenvolvimento - Endpoints criados, UI em construção

#### Exames
⏳ Em desenvolvimento - Endpoints criados, UI em construção

---

## 🔐 Dados de Teste

### Usuários Pré-criados:
| Email | Senha | Nome | Role |
|-------|-------|------|------|
| admin@khronos.com | - | Admin | admin |
| medico@khronos.com | - | Dr. Silva | medico |
| recepcao@khronos.com | - | Maria | recepcao |
| novo@khronos.com | senha123 | Novo Usuário | medico |

**Nota**: Os três primeiros foram inseridos sem hash. Use o comando de login para gerar credenciais corretas.

### Pacientes Pré-criados:
1. **PAC001** - João Silva (M)
   - CPF: 123.456.789-00
   - Email: joao@email.com
   - Convênio: Unimed

2. **PAC002** - Maria Santos (F)
   - CPF: 987.654.321-00
   - Email: maria@email.com
   - Convênio: SulAmérica

3. **PAC003** - Pedro Costa (M)
   - CPF: 456.789.123-00
   - Email: pedro@email.com
   - Convênio: Particular

---

## 🛠️ Troubleshooting

### ❌ "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Se não estiver, iniciar
docker start professor-em-movimento-postgres

# Se erro de container, recriá-lo
docker rm khronos-postgres
docker run --name khronos-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=khronos_med -d -p 5432:5432 postgres:latest
```

### ❌ "ECONNREFUSED - Backend não está respondendo"
```bash
# Verificar se backend está rodando
curl http://localhost:3000/health

# Se erro, iniciar backend
cd backend
npm run build  # Compilar TypeScript
npm start      # Rodar
```

### ❌ "Module not found" ou erros de imports
```bash
# Limpar cache e reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# No backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ❌ "Port 3000 already in use"
```bash
# Encontrar processo usando porta 3000
lsof -i :3000  # Unix/Mac
netstat -ano | findstr :3000  # Windows

# Matar o processo
kill -9 <PID>  # Unix/Mac
taskkill /PID <PID> /F  # Windows
```

### ❌ "Credentials invalid" após fazer login
- Certifique-se de que usou `/api/auth/register` primeiro
- Use as credenciais recém-criadas
- Verificar se a senha está correta

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│ Port 5173 - Vite Development Server                         │
├─────────────────────────────────────────────────────────────┤
│  - App.tsx (Roteamento)                                      │
│  - ProtectedRoute (Autenticação)                            │
│  - useAuth (Hook de autenticação)                           │
│  - Pages (Dashboard, Pacientes, etc)                        │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP (fetch)
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express + TS)                     │
│ Port 3000 - Node.js Server                                   │
├─────────────────────────────────────────────────────────────┤
│  - POST   /api/auth/register                                │
│  - POST   /api/auth/login                                   │
│  - GET    /api/auth/profile                                 │
│  - CRUD   /api/patients                                     │
│  - CRUD   /api/soap                                         │
│  - CRUD   /api/appointments                                 │
│  - CRUD   /api/prescriptions                                │
│  - CRUD   /api/exam-orders                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL (pg pool)
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                           │
│ Port 5432 - Docker Container                                │
├─────────────────────────────────────────────────────────────┤
│  - users (Usuários e profissionais)                         │
│  - patients (Pacientes)                                     │
│  - soap_notes (Notas SOAP)                                  │
│  - appointments (Agendamentos)                              │
│  - prescriptions (Prescrições)                              │
│  - exam_orders (Pedidos de exames)                          │
│  - audit_logs (Logs de auditoria)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Requisição (Exemplo: Listar Pacientes)

```
1. Usuário em /pacientes clica em "Atualizar"
   ↓
2. Patients.tsx useEffect chama: patients.list()
   ↓
3. api.ts: request('GET', '/patients')
   ↓
4. Adiciona header: Authorization: Bearer <token>
   ↓
5. fetch('http://localhost:3000/api/patients')
   ↓
6. Backend: authMiddleware valida token
   ↓
7. Backend: patientController.list()
   ↓
8. SQL: SELECT * FROM patients
   ↓
9. PostgreSQL retorna dados
   ↓
10. Backend retorna JSON
    ↓
11. Frontend converte e atualiza estado
    ↓
12. UI renderiza lista de pacientes
```

---

## 📈 Próximas Sprints

### Sprint 2: Notas SOAP
- [ ] Criar UI para SOAP notes
- [ ] Implementar CRUD de SOAP
- [ ] Integrar vitais (PA, FC, FR, Temp, SpO2)
- [ ] Testar assinatura eletrônica (mock)

### Sprint 3: Agendamentos
- [ ] Implementar calendário
- [ ] CRUD de agendamentos
- [ ] Confirmação via SMS/Email
- [ ] Integração com Google Calendar

### Sprint 4: Prescrições
- [ ] UI para prescrições
- [ ] CRUD de prescrições
- [ ] Integração com farmácias
- [ ] Relatório de medicamentos

### Sprint 5: Segurança
- [ ] HTTPS/SSL
- [ ] 2FA (Two-Factor Authentication)
- [ ] Certificado digital para assinaturas
- [ ] Auditoria completa
- [ ] Backup automático

---

## 📞 Suporte

### Logs
```bash
# Backend
tail -f logs/backend.log

# Frontend (console do browser)
F12 → Console → Verificar erros
```

### Documentação
- Backend API: http://localhost:3000/ (exibe documentação)
- Frontend: src/pages/*.tsx (componentes React)
- Database: schema.sql (estrutura das tabelas)

### Contato
- Projeto: Khronos Med
- Status: MVP - Em desenvolvimento
- Última atualização: 2026-11-21

---

**🎉 Pronto para começar! Acesse http://localhost:5173/login**
