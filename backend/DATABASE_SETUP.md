# 🗄️ Setup PostgreSQL para Khronos Medical

## Windows

### 1. Instalar PostgreSQL

1. Download em: https://www.postgresql.org/download/windows/
2. Execute o instalador e siga as instruções
3. Anote a senha do usuário `postgres`
4. Marque "pgAdmin 4" na instalação

### 2. Abrir Command Prompt

```cmd
# Conectar ao PostgreSQL (substitua senha)
psql -U postgres
```

### 3. Criar Banco de Dados

```sql
-- Criar banco
CREATE DATABASE khronos_med;

-- Conectar ao banco
\c khronos_med

-- Executar schema (a partir do diretório backend)
\i schema.sql

-- Verificar tabelas criadas
\dt
```

### 4. Testar Conexão

Adicionar à `.env`:
```env
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/khronos_med
```

---

## Linux (Ubuntu/Debian)

### 1. Instalar PostgreSQL

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### 2. Configurar PostgreSQL

```bash
# Acessar como usuário postgres
sudo -u postgres psql
```

### 3. Criar Usuário e Banco

```sql
-- Criar usuário
CREATE USER medico WITH PASSWORD 'senha123';

-- Criar banco
CREATE DATABASE khronos_med OWNER medico;

-- Conectar ao banco
\c khronos_med

-- Executar schema
\i schema.sql

-- Verificar
\dt
```

### 4. Permitir conexão local

Editar `/etc/postgresql/*/main/postgresql.conf`:
```
listen_addresses = 'localhost'
```

Editar `/etc/postgresql/*/main/pg_hba.conf`:
```
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

---

## macOS

### 1. Instalar com Homebrew

```bash
brew install postgresql@15
brew services start postgresql@15
```

### 2. Criar Banco

```bash
# Conectar
psql postgres

# Criar banco e usuário
CREATE DATABASE khronos_med;
CREATE USER medico WITH PASSWORD 'senha123';
GRANT ALL PRIVILEGES ON DATABASE khronos_med TO medico;

# Conectar ao banco
\c khronos_med

# Executar schema
\i schema.sql
```

---

## 🔍 Verificar Dados Criados

### Ver Usuários
```sql
SELECT id, email, name, role, created_at FROM users;
```

### Ver Pacientes
```sql
SELECT id, name, cpf, email, insurance FROM patients;
```

### Ver Notas SOAP
```sql
SELECT id, patient_id, diagnostico, signed, created_at FROM soap_notes;
```

### Ver Logs de Auditoria
```sql
SELECT user_id, action, entity, entity_id, created_at FROM audit_logs ORDER BY created_at DESC;
```

---

## 📊 Backup e Restore

### Fazer Backup

**Windows:**
```cmd
pg_dump -U postgres khronos_med > backup.sql
```

**Linux/Mac:**
```bash
pg_dump -U medico khronos_med > backup.sql
```

### Restaurar Backup

```sql
psql -U postgres
CREATE DATABASE khronos_med;
\c khronos_med
\i backup.sql
```

---

## 🆘 Troubleshooting

### Erro: "password authentication failed"

Resetar senha do postgres (Linux):
```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'newpassword';
```

### Erro: "database already exists"

```sql
DROP DATABASE IF EXISTS khronos_med;
CREATE DATABASE khronos_med;
```

### Erro: "psql not found"

Adicionar PostgreSQL ao PATH:

**Windows:**
- Painel de Controle → Variáveis de Ambiente
- Adicionar: `C:\Program Files\PostgreSQL\15\bin`

---

## ✅ Pronto!

Backend está pronto para conectar ao banco de dados. Execute:

```bash
npm run dev
```
