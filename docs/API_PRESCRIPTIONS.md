# 💊 Prescrições - API Endpoints

## Overview
Sistema de gerenciamento de prescrições médicas com suporte a prescrições simples e controladas.

## Endpoints

### 1. Criar Prescrição
```
POST /api/prescriptions
Authorization: Bearer {token}

Body:
{
  "patient_id": "uuid",
  "professional_id": "uuid",
  "soap_note_id": "uuid (opcional)",
  "date": "2024-01-15",
  "items": [
    {
      "medicine": "Dipirona",
      "dosage": "500mg",
      "frequency": "8 em 8 horas",
      "duration": "7 dias",
      "route": "oral"
    }
  ],
  "observations": "Tomar com alimento",
  "type": "simples|controlada",
  "valid_from": "2024-01-15",
  "valid_until": "2024-02-15"
}

Response: 201 Created
{
  "id": "uuid",
  "patient_id": "uuid",
  "status": "ativa",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

### 2. Listar Prescrições do Paciente
```
GET /api/prescriptions/patient/{patientId}
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid",
    "patient_id": "uuid",
    "date": "2024-01-15",
    "status": "ativa",
    "items": [...],
    ...
  }
]
```

### 3. Obter Prescrição por ID
```
GET /api/prescriptions/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "patient_id": "uuid",
  "items": [...]
  ...
}
```

### 4. Listar Prescrições Ativas
```
GET /api/prescriptions/patient/{patientId}/active
Authorization: Bearer {token}

Response: 200 OK
[
  Prescrições com status "ativa" e valid_until >= hoje
]
```

### 5. Listar Prescrições por Nota SOAP
```
GET /api/prescriptions/soap-note/{soapNoteId}
Authorization: Bearer {token}

Response: 200 OK
[...]
```

### 6. Atualizar Prescrição
```
PUT /api/prescriptions/{id}
Authorization: Bearer {token}

Body:
{
  "items": [...],
  "observations": "Novas observações",
  "status": "ativa|cumprida|cancelada",
  "valid_until": "2024-02-20"
}

Response: 200 OK
{...}
```

### 7. Cancelar Prescrição
```
PATCH /api/prescriptions/{id}/cancel
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "status": "cancelada",
  ...
}
```

### 8. Deletar Prescrição (Admin)
```
DELETE /api/prescriptions/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Prescription deleted successfully"
}
```

## Status Disponíveis
- `ativa`: Prescrição válida e ativa
- `cumprida`: Prescrição já utilizada
- `cancelada`: Prescrição cancelada

## Tipos de Prescrição
- `simples`: Prescrição comum
- `controlada`: Prescrição de medicamentos controlados

## Estrutura do Item de Prescrição
```json
{
  "medicine": "Nome do medicamento",
  "dosage": "Dosagem (ex: 500mg)",
  "frequency": "Frequência (ex: 8 em 8 horas)",
  "duration": "Duração (ex: 7 dias)",
  "route": "Via de administração (opcional, ex: oral)"
}
```
