#!/bin/bash
# Scripts e Comandos Úteis para Khronos Medical

## ============================================================================
## 🚀 INICIAR DESENVOLVIMENTO
## ============================================================================

# 1. Instalar dependências
npm install
cd backend && npm install

# 2. Build do backend
cd backend && npm run build

# 3. Iniciar backend (produção)
cd backend && npm start

# 4. Iniciar backend (desenvolvimento com ts-node)
cd backend && npm run dev

# 5. Iniciar frontend
npm run dev

# 6. Compilar frontend para produção
npm run build

## ============================================================================
## 🗄️ BANCO DE DADOS
## ============================================================================

# 1. Conectar ao PostgreSQL
psql -U postgres

# 2. Criar banco de dados
createdb -U postgres khronos_med

# 3. Inicializar schema
psql -U postgres -d khronos_med -f backend/schema.sql

# 4. Executar query
psql -U postgres -d khronos_med -c "SELECT * FROM users;"

# 5. Despejar banco de dados
pg_dump -U postgres khronos_med > backup.sql

# 6. Restaurar banco de dados
psql -U postgres -d khronos_med < backup.sql

## ============================================================================
## 🧪 TESTES
## ============================================================================

# 1. Health check
curl http://localhost:3000/health

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 3. Listar pacientes
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:3000/api/patients

# 4. Criar agendamento
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id":"uuid",
    "professional_id":"uuid",
    "unit_id":"uuid",
    "date":"2024-01-15",
    "start_time":"10:00",
    "end_time":"11:00",
    "type":"consulta"
  }'

# 5. Criar prescrição
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id":"uuid",
    "professional_id":"uuid",
    "date":"2024-01-15",
    "items":[{"medicine":"Dipirona","dosage":"500mg","frequency":"8h","duration":"7d"}]
  }'

# 6. Criar exame
curl -X POST http://localhost:3000/api/exam-orders \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id":"uuid",
    "professional_id":"uuid",
    "date":"2024-01-15",
    "exams":[{"name":"Hemograma","code":"HC-001"}],
    "priority":"normal"
  }'

## ============================================================================
## 📦 DEPENDÊNCIAS
## ============================================================================

# Backend
npm install express cors dotenv pg bcryptjs jsonwebtoken pg-pool typescript ts-node

# Dev Dependencies
npm install --save-dev @types/express @types/cors @types/node @types/pg @types/jsonwebtoken

# Frontend
npm install react react-dom react-router-dom zustand axios

# Dev Dependencies
npm install --save-dev @types/react @types/react-dom typescript

## ============================================================================
## 🔧 BUILD E DEPLOY
## ============================================================================

# 1. Compilar TypeScript
cd backend && npx tsc

# 2. Verificar tipos
cd backend && npx tsc --noEmit

# 3. Executar linter (se configurado)
npm run lint

# 4. Executar testes (se configurado)
npm test

# 5. Build frontend otimizado
npm run build

# 6. Preview do build
npm run preview

## ============================================================================
## 📊 MONITORAMENTO
## ============================================================================

# 1. Verificar porta em uso
lsof -i :3000
netstat -tuln | grep 3000

# 2. Logs do backend
tail -f backend/logs/server.log

# 3. Verificar processo
ps aux | grep node

# 4. Matar processo
kill -9 {PID}

## ============================================================================
## 🔐 SEGURANÇA
## ============================================================================

# 1. Gerar novo JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Atualizar .env
# Editar backend/.env com novo JWT_SECRET

# 3. Hash de senha (bcrypt)
# Usar bcryptjs no código: await hashPassword('senha')

## ============================================================================
## 📚 DOCUMENTAÇÃO
## ============================================================================

# Arquivos principais:
# - docs/API_APPOINTMENTS.md        (Documentação de Agendamentos)
# - docs/API_PRESCRIPTIONS.md       (Documentação de Prescrições)
# - docs/API_EXAMS.md               (Documentação de Exames)
# - docs/INTEGRATION_GUIDE.md       (Guia de Integração)
# - IMPLEMENTATION_SUMMARY.md       (Resumo de Implementação)
# - QUICK_START.md                  (Este arquivo)

## ============================================================================
## 🌐 VARIÁVEIS DE AMBIENTE
## ============================================================================

# backend/.env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/khronos_med
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# frontend/.env (se necessário)
VITE_API_URL=http://localhost:3000/api

## ============================================================================
## 📞 TROUBLESHOOTING
## ============================================================================

# Erro: Cannot find module 'pg'
npm install

# Erro: Database connection refused
# 1. Verificar se PostgreSQL está rodando
# 2. Verificar DATABASE_URL em .env
# 3. Verificar credenciais

# Erro: Port already in use
lsof -i :3000
kill -9 {PID}

# Erro: TypeScript compilation error
cd backend && npx tsc --noEmit

# Erro: JWT token inválido
# Fazer novo login para obter novo token

## ============================================================================
## 📈 ESTRUTURA DE PASTAS
## ============================================================================

khronos_med_prototipo/
├── backend/
│   ├── src/
│   │   ├── controllers/      (Lógica de negócio)
│   │   ├── routes/           (Endpoints)
│   │   ├── middleware/       (Autenticação, etc)
│   │   ├── config/           (Configurações)
│   │   ├── utils/            (Utilitários)
│   │   └── server.ts         (Entry point)
│   ├── dist/                 (Build compilado)
│   ├── schema.sql            (Schema do BD)
│   ├── .env                  (Variáveis de ambiente)
│   └── package.json
│
├── src/
│   ├── lib/
│   │   ├── api.ts           (Cliente da API)
│   │   └── useAuth.ts       (Hook de autenticação)
│   ├── pages/               (Componentes)
│   ├── components/          (Componentes reutilizáveis)
│   ├── App.tsx
│   └── main.tsx
│
├── docs/
│   ├── API_APPOINTMENTS.md
│   ├── API_PRESCRIPTIONS.md
│   ├── API_EXAMS.md
│   └── INTEGRATION_GUIDE.md
│
├── IMPLEMENTATION_SUMMARY.md
├── QUICK_START.md
├── package.json
└── vite.config.ts
