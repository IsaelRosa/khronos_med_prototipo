# 🚀 Quick Reference - Khronos Med

## ⚡ Iniciar Aplicação (3 Comandos)

```bash
# Terminal 1: Backend
cd D:\Projetos\khronos_med_prototipo\backend
npm start

# Terminal 2: Frontend
cd D:\Projetos\khronos_med_prototipo
npm run dev

# Terminal 3: PostgreSQL (se necessário)
docker start professor-em-movimento-postgres
```

## 🌐 URLs

| Serviço | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | 🟢 |
| Backend | http://localhost:3000 | 🟢 |
| Database | localhost:5432 | 🟢 |
| Login | http://localhost:5173/login | 🟢 |

## 🔑 Credenciais de Teste

```
Email: novo@khronos.com
Senha: senha123
```

## 📝 Endpoints Mais Usados

### Autenticação
```bash
# Registrar
POST /api/auth/register
{
  "email": "novo@email.com",
  "password": "senha",
  "name": "Nome",
  "role": "medico"
}

# Login
POST /api/auth/login
{
  "email": "novo@khronos.com",
  "password": "senha123"
}

# Obter perfil (precisa token)
GET /api/auth/profile
Header: Authorization: Bearer <token>
```

### Pacientes
```bash
# Listar (precisa token)
GET /api/patients
Header: Authorization: Bearer <token>

# Criar
POST /api/patients
Header: Authorization: Bearer <token>
{
  "code": "PAC004",
  "name": "João Silva",
  "cpf": "123.456.789-00",
  "birth": "1990-01-01",
  "sex": "M",
  "phone": "11999999999",
  "email": "joao@email.com",
  "address": "Rua A, 123",
  "insurance": "Unimed"
}

# Atualizar
PUT /api/patients/<id>
Header: Authorization: Bearer <token>

# Deletar
DELETE /api/patients/<id>
Header: Authorization: Bearer <token>
```

## 🗂️ Estrutura de Arquivos

```
khronos_med_prototipo/
├── backend/
│   ├── src/
│   │   ├── server.ts           ← Main server
│   │   ├── config/
│   │   │   └── database.ts     ← PostgreSQL connection
│   │   ├── middleware/
│   │   │   └── auth.ts         ← JWT middleware
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── patientController.ts
│   │   │   ├── soapController.ts
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── patients.ts
│   │   │   └── ...
│   │   └── utils/
│   │       └── jwt.ts
│   ├── schema.sql              ← Database schema
│   ├── .env                    ← Configuration
│   └── package.json
├── src/
│   ├── App.tsx                 ← Main app
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Patients.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts              ← API client
│   │   ├── useAuth.ts          ← Auth hook
│   │   └── ...
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx  ← Route protection
│   │   └── ...
│   └── ...
└── ...
```

## 📊 Tabelas do Banco

```sql
-- Users (Profissionais)
users (id, email, password, name, role, ...)

-- Pacientes
patients (id, code, name, cpf, email, ...)

-- Notas SOAP
soap_notes (id, patient_id, professional_id, ...)

-- Agendamentos
appointments (id, patient_id, professional_id, ...)

-- Prescrições
prescriptions (id, patient_id, professional_id, ...)

-- Exames
exam_orders (id, patient_id, professional_id, ...)

-- Auditoria
audit_logs (id, user_id, action, ...)
```

## 🧪 Testes Rápidos

### Via Browser
1. Acesse http://localhost:5173
2. Digite: novo@khronos.com / senha123
3. Clique "Entrar"

### Via API (PowerShell)
```powershell
# Listar pacientes
$token = "seu_token_aqui"
$uri = "http://localhost:3000/api/patients"
$response = Invoke-WebRequest -Uri $uri -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
$response.Content | ConvertFrom-Json
```

### Via Docker/DB
```bash
# Conectar ao banco
docker exec professor-em-movimento-postgres psql -U postgres -d khronos_med -c "SELECT * FROM patients;"

# Ver usuários
docker exec professor-em-movimento-postgres psql -U postgres -d khronos_med -c "SELECT * FROM users;"
```

## ⚠️ Troubleshooting

### Backend não inicia
```bash
cd backend
npm run build  # Compilar TypeScript
npm start      # Rodar
```

### "Cannot connect to database"
```bash
docker ps  # Verificar se PostgreSQL está rodando
docker start professor-em-movimento-postgres
```

### "Port 3000 already in use"
```bash
# Matar processo (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Frontend mostra erro de conexão
```bash
# Verificar se backend está respondendo
curl http://localhost:3000/health  # Deve retornar status OK
```

## 📚 Documentação Completa

Arquivos com documentação detalhada:

1. `DATABASE_SETUP_COMPLETE.md` - Setup do banco
2. `INTEGRATION_FRONTEND_BACKEND.md` - Integração
3. `GETTING_STARTED_COMPLETE.md` - Guia completo
4. `DATABASE_SUMMARY.md` - Resumo executivo

## 🔐 Segurança

- ✅ JWT com expiração de 7 dias
- ✅ Senhas com hash (bcryptjs)
- ✅ CORS configurado
- ✅ Proteção de rotas
- ✅ Token validado a cada requisição

## 🎯 Próximos Passos

1. Testar SOAP Notes
2. Implementar Agendamentos
3. Implementar Prescrições
4. Adicionar 2FA
5. Deploy em produção

## 📞 Dúvidas?

- Verificar os arquivos de documentação
- Consultar console do navegador (F12)
- Consultar logs do backend

---

**Última atualização**: 21 de Novembro de 2026  
**Status**: 🟢 Pronto para usar
