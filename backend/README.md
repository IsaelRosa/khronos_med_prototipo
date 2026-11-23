# Khronos Medical Backend API

Backend API completo para o sistema de gestão médica Khronos.

## 🚀 Setup Rápido

### 1. Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### 2. Instalação

```bash
cd backend
npm install
```

### 3. Configurar Banco de Dados

**Windows (Command Prompt):**
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE khronos_med;

# Conectar ao banco
\c khronos_med

# Executar schema
\i schema.sql
```

**Linux/Mac:**
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE khronos_med;

# Conectar ao banco
\c khronos_med

# Executar schema
\i schema.sql
```

### 4. Configurar Variáveis de Ambiente

Editar `.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/khronos_med
JWT_SECRET=sua_chave_secreta_aqui_mude_em_producao
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

Em produção, `JWT_SECRET` é obrigatória e deve ter pelo menos 32 caracteres.
O cadastro de usuários passa a exigir um token de administrador ou
superadministrador; cadastros públicos permanecem disponíveis apenas fora de
produção.

### Publicação em um único serviço Node.js

Configure a raiz do repositório como diretório do serviço e use Node.js 20.19+
ou 22.12+. A instalação deve incluir as dependências de desenvolvimento, pois
elas são necessárias à compilação. O `.npmrc` da raiz solicita que o npm
inclua essas dependências mesmo com `NODE_ENV=production`; confirme que a
hospedagem instala a partir da raiz e não sobrescreve essa configuração:

```bash
npm ci --include=dev
npm run build:deploy
npm start
```

Se o painel solicitar um arquivo de entrada Node.js, informe `server.cjs` na
raiz. O comando de build deve ser `npm run build:deploy`, não `npm run build`:
o segundo compila apenas o frontend. O serviço precisa manter tanto `dist`
quanto `backend/dist` e as dependências no ambiente de execução; publicar
apenas o diretório de saída `dist` não executa o servidor.

O build compila o frontend e a API; o servidor entrega ambos na porta definida
pela hospedagem. O frontend usa `/api` na mesma origem. Se
`VITE_API_BASE_URL` estiver definida no ambiente de build, ela sobrescreve esse
valor e deve apontar para a API desejada. Configure `NODE_ENV=production`,
`DATABASE_URL` e `JWT_SECRET` no serviço, e prepare o banco conforme descrito
abaixo. Não publique segredos no repositório. O health check `/health` não
verifica a conexão com o banco.

Esta configuração exige uma hospedagem que execute um processo Node.js
persistente; publicar somente a pasta `dist` não inicia a API. Consulte a
limitação de segurança abaixo antes de tornar o serviço público.

### Publicação separada para testes

O frontend e a API precisam ser publicados separadamente, a menos que a hospedagem
configure um proxy para a API. A aplicação Node.js deve usar a pasta `backend`,
executar `npm run build` e iniciar com `npm start`. Configure nela `NODE_ENV`,
`DATABASE_URL`, `JWT_SECRET` e `CORS_ORIGINS` no painel da hospedagem; use uma
chave JWT longa e aleatória e não publique credenciais no repositório. `PORT` é
normalmente fornecida pela hospedagem. A URL do PostgreSQL deve usar os requisitos
de conexão segura do provedor. Execute `schema.sql` em um banco novo e exclusivo
para testes; o banco local e seus usuários não são copiados automaticamente.

`CORS_ORIGINS` é uma lista de origens do frontend separadas por vírgula, sem
caminho nem barra final. Por exemplo:

```env
CORS_ORIGINS=https://seu-frontend.example.com
```

No deploy do frontend, defina `VITE_API_BASE_URL` **antes do build** com a URL
HTTPS pública da API incluindo `/api`, por exemplo
`https://sua-api.example.com/api`, e publique novamente o frontend. A variável
fica visível no navegador e não deve conter segredos. Sem essa configuração, o
build de produção informará um erro ao tentar acessar a API; em desenvolvimento,
usa `http://localhost:3000/api` por padrão.

Verifique a API em `https://sua-api.example.com/health` e depois teste o login
com uma conta criada no banco de testes. O health check não verifica o banco.
Veja as limitações de segurança abaixo antes de tornar a API pública.

### 5. Executar o Servidor

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm start
```

### Agenda

A agenda busca pacientes e usuários com o perfil `medico` no banco e salva os agendamentos pela API. No agendamento, selecione **Iniciar atendimento** para criar ou retomar um rascunho SOAP; o prontuário exibe as notas por paciente. A seleção de unidade e a lista de espera ainda usam dados do protótipo. Agendamentos e notas antigos salvos apenas no navegador não são migrados automaticamente.

Ao abrir um paciente ou suas notas, os agendamentos relacionados são listados independentemente da data e da unidade exibidas no calendário. É possível iniciar ou retomar um atendimento elegível, ou abrir a agenda e criar um agendamento com o paciente pré-selecionado. Prescrições, exames e financeiro ainda não estão integrados à tela do paciente.

O atendimento permite apenas salvar rascunhos. Assinatura certificada e encerramento não estão disponíveis; salvar o rascunho não finaliza a consulta nem gera lançamento financeiro.

**Limitação de segurança:** a API ainda não restringe a leitura de informações clínicas pelo vínculo do profissional com o paciente. Fora de produção, o cadastro público aceita o perfil informado. Não utilize dados clínicos reais até que os controles de acesso e a proteção operacional sejam implementados e validados. O protótipo, por si só, não comprova conformidade com a LGPD ou com normas profissionais.

Para testar a persistência existente sem usar o banco da aplicação, execute `node --test tests\isolated-flow.test.cjs` dentro de `backend`. O teste cria e remove um banco exclusivo com dados de teste; o usuário configurado em `DATABASE_URL` precisa ter permissão `CREATEDB`.

### MySQL experimental

O PostgreSQL continua sendo o padrão. Para testar o backend com MySQL 8, crie
um banco vazio e exclusivo, execute `schema.mysql.sql` nele e configure:

```env
DB_DRIVER=mysql
MYSQL_DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/BANCO
MYSQL_SSL=true
```

`MYSQL_SSL=true` ativa TLS com validação de certificado; omita essa variável
apenas em um ambiente de teste local isolado. Não coloque credenciais no
repositório. A compatibilidade com a versão e configuração específica da
Hostinger ainda precisa ser confirmada.

Para popular um banco de teste isolado com dados fictícios, importe
`dados-ficticios.mysql.sql` depois de `schema.mysql.sql`. O arquivo cria três
usuários e cinco pacientes. Os usuários `admin-teste@example.invalid`,
`medico-teste@example.invalid` e `recepcao-teste@example.invalid` usam a senha
conhecida `senha123`. Execute o arquivo apenas uma vez, em um banco sem registros
conflitantes; se ocorrer erro durante a importação, reverta a transação e
verifique o banco antes de tentar novamente. Nunca use essas contas ou dados
em produção nem em ambiente acessível ao público.

O script `scripts/migrate-postgres-to-mysql.cjs` foi testado com dados fictícios
em bancos isolados. Ele exige `SOURCE_DATABASE_URL` e `MYSQL_DATABASE_URL`,
recusa tabelas de destino não vazias e verifica os registros copiados. O destino
deve ter recebido `schema.mysql.sql`; a API de destino deve permanecer desligada
durante a cópia. Não migre dados reais sem backup, validação completa e revisão
dos controles de acesso. Não use `MYSQL_TLS=disabled` fora de testes isolados.

Os testes `tests/mysql-flow.test.cjs` e `tests/mysql-migration.test.cjs` exigem
bancos de teste vazios e exclusivos; nunca os execute em bancos existentes da
aplicação. O primeiro recebe `MYSQL_DATABASE_URL`; o segundo recebe
`TEST_PG_DATABASE_URL` e `TEST_MYSQL_DATABASE_URL`.

## 📚 API Endpoints

### Autenticação

#### Registrar Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "medico@hospital.com",
  "password": "senha123",
  "name": "Dr. João Silva",
  "role": "medico"
}
```

**Roles disponíveis:**
- `recepcao` - Recepcionista
- `medico` - Médico
- `enfermeiro` - Enfermeiro
- `financeiro` - Financeiro
- `gestor` - Gestor
- `admin` - Administrador
- `superadmin` - Super Administrador

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "medico@hospital.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid",
    "email": "medico@hospital.com",
    "name": "Dr. João Silva",
    "role": "medico"
  },
  "token": "jwt_token_aqui"
}
```

#### Obter Perfil
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

### Pacientes

#### Criar Paciente
```http
POST /api/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "KH1000",
  "name": "João Silva",
  "cpf": "123.456.789-00",
  "birth": "1990-05-15",
  "sex": "M",
  "phone": "(11) 99999-9999",
  "whatsapp": "(11) 99999-9999",
  "email": "joao@email.com",
  "address": "Rua Principal, 123 - São Paulo/SP",
  "emergencyContact": "Maria Silva — (11) 98888-8888",
  "insurance": "Unimed",
  "insuranceCard": "123456",
  "allergies": ["Penicilina"],
  "medications": ["Losartana 50mg"],
  "notes": "Notas adicionais"
}
```

#### Listar Pacientes
```http
GET /api/patients
Authorization: Bearer {token}
```

#### Obter Paciente
```http
GET /api/patients/{id}
Authorization: Bearer {token}
```

#### Buscar Pacientes
```http
GET /api/patients/search?q=João
Authorization: Bearer {token}
```

#### Atualizar Paciente
```http
PUT /api/patients/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "João Silva",
  "phone": "(11) 99999-9999",
  ...
}
```

#### Deletar Paciente (Admin)
```http
DELETE /api/patients/{id}
Authorization: Bearer {token}
```

### Notas SOAP

#### Rascunho vinculado ao atendimento

`GET /api/soap/appointment/{appointmentId}` retorna a nota e sua `version`, ou `null` quando ainda não existe. `PUT /api/soap/appointment/{appointmentId}/draft` salva todos os campos clínicos como strings e exige `expectedVersion`: `null` na primeira gravação ou a `version` recebida anteriormente. Alterações concorrentes são rejeitadas com HTTP 409. A nota pertence ao usuário autenticado, e a gravação, o status do agendamento e a auditoria são atômicos.

#### Criar Nota SOAP sem agendamento
```http
POST /api/soap
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "uuid",
  "queixa": "Dor de cabeça",
  "hda": "Há 3 dias",
  "antecedentes": "Migrânea",
  "medicamentos": "Dipirona",
  "alergias": "Penicilina",
  "habitos": "Não fuma",
  "subjetivo": "Paciente relata dor",
  "objetivo": "Exame físico normal",
  "avaliacao": "Migrânea provável",
  "plano": "Repouso e medicação",
  "hipotese": "Migrânea",
  "diagnostico": "G43",
  "conduta": "Prescrever triptano",
  "retorno": "7 dias",
  "pa": "120/80",
  "fc": "70",
  "fr": "16",
  "temp": "36.5",
  "spo2": "98",
  "peso": "70",
  "altura": "175"
}
```

#### Listar Notas de Paciente
```http
GET /api/soap/patient/{patientId}
Authorization: Bearer {token}
```

#### Obter Nota SOAP
```http
GET /api/soap/{id}
Authorization: Bearer {token}
```

#### Atualizar Nota SOAP
Para notas vinculadas a agendamentos, use a rota de rascunho acima.

```http
PUT /api/soap/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "queixa": "Dor de cabeça intensa",
  ...
}
```

#### Assinar Nota SOAP
```http
POST /api/soap/{id}/sign
Authorization: Bearer {token}
```

Este endpoint responde HTTP 501: assinatura certificada ainda não foi implementada. Notas previamente marcadas como assinadas não podem ser editadas ou deletadas.

#### Deletar Nota SOAP
```http
DELETE /api/soap/{id}
Authorization: Bearer {token}
```

**Restrições:**
- Apenas notas não assinadas podem ser deletadas
- Apenas o médico que criou a nota pode deletá-la
- Notas vinculadas a atendimentos não podem ser deletadas por esta rota

## 🔐 Segurança

### Autenticação JWT
- Tokens expirando em 7 dias (configurável)
- Incluir token no header: `Authorization: Bearer {token}`

### Permissões por Função
- **Público:** Sem acesso a endpoints protegidos
- **Recepcionista:** Apenas leitura de pacientes
- **Médico:** Criar e editar rascunhos de notas SOAP
- **Admin:** Acesso total exceto criar pacientes
- **SuperAdmin:** Acesso total

## 📊 Auditoria

Todas as ações de CRUD são registradas na tabela `audit_logs` com:
- ID do usuário que fez a ação
- Tipo de ação (CREATE, UPDATE, DELETE, SIGN)
- Entidade afetada
- ID da entidade
- Timestamp

## 🗄️ Banco de Dados

### Schema
O arquivo `schema.sql` cria:
- `users` - Usuários do sistema
- `patients` - Dados dos pacientes
- `soap_notes` - Notas clínicas SOAP
- `audit_logs` - Log de auditoria

### Índices
- CPF e Email em pacientes (busca rápida)
- patient_id e professional_id em notas SOAP
- user_id em audit logs

## 🚨 Tratamento de Erros

Respostas de erro seguem o padrão:
```json
{
  "error": "Descrição do erro"
}
```

Códigos de status:
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (não autorizado)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Logs

Logs são exibidos no console durante desenvolvimento. Em produção, implementar sistema de logging (Winston, Pino, etc).

## 🔄 Próximas Implementações

- [ ] Integração com WebSocket para atualizações em tempo real
- [ ] Upload de arquivos (anexos nas notas)
- [ ] Certificado digital para assinatura eletrônica
- [ ] Integração com wearables
- [ ] Endpoints de prescrições
- [ ] Endpoints de exames
- [ ] Sistema de pagamentos
- [ ] Notificações (email, SMS, push)
- [ ] Relatórios e dashboards

## 📧 Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue.
