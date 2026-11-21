# 📅 Agendamentos - API Endpoints

## Overview
Sistema de gerenciamento de agendamentos médicos com suporte a múltiplos tipos de consultas e teleconsultas.

## Endpoints

### 1. Criar Agendamento
```
POST /api/appointments
Authorization: Bearer {token}

Body:
{
  "patient_id": "uuid",
  "professional_id": "uuid",
  "unit_id": "uuid",
  "date": "2024-01-15",
  "start_time": "10:00",
  "end_time": "11:00",
  "type": "consulta|retorno|procedimento|teleconsulta|exame",
  "specialty": "Clínica Geral",
  "procedure": "Consulta de Rotina",
  "insurance": "Unimed",
  "value": 150.00,
  "payment_method": "cartao|dinheiro|convenio",
  "notes": "Notas adicionais",
  "telehealth_url": "https://..."
}

Response: 201 Created
{
  "id": "uuid",
  "patient_id": "uuid",
  "status": "agendado",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

### 2. Listar Agendamentos do Paciente
```
GET /api/appointments/patient/{patientId}
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid",
    "patient_id": "uuid",
    "date": "2024-01-15",
    "start_time": "10:00",
    "type": "consulta",
    "status": "agendado",
    ...
  }
]
```

### 3. Obter Agendamento por ID
```
GET /api/appointments/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "patient_id": "uuid",
  "date": "2024-01-15",
  ...
}
```

### 4. Listar Agendamentos por Data
```
GET /api/appointments/range?start_date=2024-01-01&end_date=2024-01-31&professional_id={uuid}
Authorization: Bearer {token}

Response: 200 OK
[...]
```

### 5. Atualizar Agendamento
```
PUT /api/appointments/{id}
Authorization: Bearer {token}

Body:
{
  "status": "em_andamento|concluido|nao_compareceu",
  "start_time": "10:30",
  "end_time": "11:30",
  "notes": "Novas notas",
  "telehealth_url": "https://..."
}

Response: 200 OK
{...}
```

### 6. Cancelar Agendamento
```
DELETE /api/appointments/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "status": "cancelado",
  ...
}
```

### 7. Listar Agendamentos de Hoje
```
GET /api/appointments/today?professional_id={uuid}
Authorization: Bearer {token}

Response: 200 OK
[...]
```

## Status Disponíveis
- `agendado`: Agendamento confirmado
- `em_andamento`: Consulta em progresso
- `concluido`: Consulta finalizada
- `nao_compareceu`: Paciente não compareceu
- `cancelado`: Agendamento cancelado

## Tipos de Agendamento
- `consulta`: Consulta padrão
- `retorno`: Consulta de retorno
- `procedimento`: Procedimento médico
- `teleconsulta`: Consulta online
- `exame`: Agendamento de exame
