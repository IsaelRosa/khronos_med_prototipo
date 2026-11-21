# 🌐 URLs Corretas - Khronos Med

## ⚠️ IMPORTANTE

**NUNCA USE**: `http://localhost:5175`  
**SEMPRE USE**: `http://localhost:5173`

---

## ✅ URLs CORRETAS

### Frontend (Khronos Med - React)
```
http://localhost:5173          ← Login e Dashboard
http://localhost:5173/login    ← Página de Login
http://localhost:5173/painel   ← Dashboard
http://localhost:5173/pacientes ← Gestão de Pacientes
http://localhost:5173/agenda   ← Agendamentos
http://localhost:5173/prontuarios ← Prontuários/SOAP
http://localhost:5173/prescricoes ← Prescrições
http://localhost:5173/exames   ← Exames
```

### Backend (API Express)
```
http://localhost:3000          ← Health Check
http://localhost:3000/api/auth/login  ← Login API
http://localhost:3000/api/patients    ← Pacientes API
```

### Banco de Dados (PostgreSQL)
```
localhost:5432                 ← Connection String
postgresql://postgres:postgres@localhost:5432/khronos_med
```

---

## ❌ URLs ERRADAS (NÃO USE)

```
http://localhost:5175/         ← Outra aplicação (não é Khronos!)
http://localhost:5175/pacientes ← ERRADA!
http://localhost:5175/login    ← ERRADA!
```

---

## 🔧 Por Que há Duas Portas?

Há outra instância de um servidor rodando na porta **5175**, mas não é a aplicação Khronos Med que configuramos.

A aplicação correta está em **5173**.

---

## 🚀 Como Acessar Corretamente

### Passo 1: Login
```
1. Abra: http://localhost:5173/login
2. Email: admin@khronos.com
3. Senha: senha123
4. Clique: Entrar
```

### Passo 2: Usar a Aplicação
```
http://localhost:5173/painel        ← Dashboard
http://localhost:5173/pacientes     ← Listar pacientes
http://localhost:5173/agenda        ← Ver agendamentos
http://localhost:5173/prontuarios   ← Ver prontuários
```

---

## 📋 Resumo

| Serviço | Porta | URL |
|---------|-------|-----|
| **Frontend (Correto)** | 5173 | http://localhost:5173 ✅ |
| Backend | 3000 | http://localhost:3000 ✅ |
| Banco de Dados | 5432 | localhost:5432 ✅ |
| ❌ Outra aplicação | 5175 | NÃO USE! |

---

**Sempre use porta 5173 para Khronos Med!**
