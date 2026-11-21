# 🧪 Pedidos de Exames - API Endpoints

## Overview
Sistema de gerenciamento de pedidos de exames com suporte a diferentes prioridades e status de processamento.

## Endpoints

### 1. Criar Pedido de Exame
```
POST /api/exam-orders
Authorization: Bearer {token}

Body:
{
  "patient_id": "uuid",
  "professional_id": "uuid",
  "soap_note_id": "uuid (opcional)",
  "date": "2024-01-15",
  "exams": [
    {
      "name": "Hemograma Completo",
      "code": "HC-001",
      "type": "Hematologia"
    }
  ],
  "priority": "normal|urgente|emergencia",
  "observations": "Em jejum de 8 horas",
  "unit_id": "uuid"
}

Response: 201 Created
{
  "id": "uuid",
  "patient_id": "uuid",
  "status": "solicitado",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

### 2. Listar Pedidos de Exames do Paciente
```
GET /api/exam-orders/patient/{patientId}
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid",
    "patient_id": "uuid",
    "date": "2024-01-15",
    "status": "solicitado",
    "exams": [...],
    ...
  }
]
```

### 3. Obter Pedido de Exame por ID
```
GET /api/exam-orders/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "patient_id": "uuid",
  "exams": [...]
  ...
}
```

### 4. Listar Pedidos Pendentes
```
GET /api/exam-orders/pending?professional_id={uuid}
Authorization: Bearer {token}

Response: 200 OK
[
  Pedidos com status "solicitado" ou "em_andamento"
]
```

### 5. Listar Pedidos por Nota SOAP
```
GET /api/exam-orders/soap-note/{soapNoteId}
Authorization: Bearer {token}

Response: 200 OK
[...]
```

### 6. Listar Pedidos por Unidade
```
GET /api/exam-orders/unit/{unitId}?status=em_andamento
Authorization: Bearer {token}

Response: 200 OK
[...]
```

### 7. Atualizar Status do Pedido
```
PUT /api/exam-orders/{id}
Authorization: Bearer {token}

Body:
{
  "status": "em_andamento|concluido|cancelado",
  "result_data": {
    "resultados": "Hemograma dentro dos limites normais"
  },
  "observations": "Exame concluído com sucesso"
}

Response: 200 OK
{...}
```

### 8. Cancelar Pedido de Exame
```
PATCH /api/exam-orders/{id}/cancel
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "status": "cancelado",
  ...
}
```

### 9. Deletar Pedido de Exame (Admin)
```
DELETE /api/exam-orders/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Exam order deleted successfully"
}
```

## Status Disponíveis
- `solicitado`: Exame foi solicitado
- `em_andamento`: Exame em processamento
- `concluido`: Exame finalizado com resultado
- `cancelado`: Exame cancelado

## Níveis de Prioridade
- `normal`: Prioridade padrão
- `urgente`: Prioridade alta
- `emergencia`: Prioridade máxima

## Estrutura do Exame
```json
{
  "name": "Nome do exame",
  "code": "Código do exame (opcional)",
  "type": "Tipo/Especialidade do exame (opcional)"
}
```

## Estrutura de Resultado
O campo `result_data` pode conter qualquer informação estruturada:
```json
{
  "resultados": "Descrição dos resultados",
  "valores": {
    "hemoglobina": "13.5 g/dL",
    "hematocrito": "40%"
  }
}
```
