# 🔐 Credenciais de Login - Khronos Med

## ✅ Usuários Funcionando

### Foram criados 3 usuários principais com a senha **`senha123`**

| Email | Senha | Nome | Role | Status |
|-------|-------|------|------|--------|
| **admin@khronos.com** | `senha123` | Admin | admin | ✅ Funcionando |
| **medico@khronos.com** | `senha123` | Dr. Silva | medico | ✅ Funcionando |
| **recepcao@khronos.com** | `senha123` | Maria | recepcao | ✅ Funcionando |
| novo@khronos.com | `senha123` | Novo Usuário | medico | ✅ Funcionando |

---

## 🔑 Como Fazer Login

### Passo 1: Abrir no navegador
```
http://localhost:5173/login
```

### Passo 2: Preencher credenciais
- **Email**: admin@khronos.com (ou medico/recepcao)
- **Senha**: senha123

### Passo 3: Clicar "Entrar"
Deve redirecionar para o dashboard em http://localhost:5173/painel

---

## ✨ Recomendação

**Use para testar:**
```
Email: admin@khronos.com
Senha: senha123
```

Este usuário tem acesso total ao sistema como administrador.

---

## 🔧 O Que Foi Corrigido

❌ **Problema**: Os 3 usuários iniciais tinham uma senha hash **fake** que não funcionava  
✅ **Solução**: Recriados com hash válido da senha "senha123"

**Hash usado**: `$2b$10$N1uYTgsvvM7wTFtAwMwjU.g6gk7BLN1hylU25jF2pTMDpH7u7PeWW`

Este hash é o resultado do bcrypt da senha "senha123" e agora funciona corretamente.

---

## 📝 Notas

- Todos os 4 usuários utilizam a **mesma senha**: `senha123`
- O backend agora consegue validar as senhas corretamente
- Se quiser adicionar novos usuários, use o endpoint `/api/auth/register`

---

**Data**: 21 de Novembro de 2026  
**Status**: 🟢 Pronto para usar
