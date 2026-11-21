# 🔗 Integração Frontend com Backend

## Endpoints Implementados

Todos os endpoints estão implementados na API do frontend em `src/lib/api.ts`.

### Agendamentos (`appointments`)

```typescript
// Criar agendamento
appointments.create(data)

// Listar agendamentos do paciente
appointments.listByPatient(patientId)

// Obter agendamento por ID
appointments.getById(id)

// Listar por intervalo de datas
appointments.listByDateRange(startDate, endDate, professionalId?)

// Atualizar agendamento
appointments.update(id, data)

// Cancelar agendamento
appointments.cancel(id)

// Listar agendamentos de hoje
appointments.getTodayAppointments(professionalId?)
```

### Prescrições (`prescriptions`)

```typescript
// Criar prescrição
prescriptions.create(data)

// Listar prescrições do paciente
prescriptions.listByPatient(patientId)

// Obter prescrição por ID
prescriptions.getById(id)

// Listar prescrições ativas
prescriptions.listActivePrescriptions(patientId)

// Listar por nota SOAP
prescriptions.listBySoapNote(soapNoteId)

// Atualizar prescrição
prescriptions.update(id, data)

// Cancelar prescrição
prescriptions.cancel(id)

// Deletar prescrição
prescriptions.delete(id)
```

### Pedidos de Exames (`examOrders`)

```typescript
// Criar pedido de exame
examOrders.create(data)

// Listar pedidos do paciente
examOrders.listByPatient(patientId)

// Obter pedido por ID
examOrders.getById(id)

// Listar pedidos pendentes
examOrders.listPending(professionalId?)

// Listar por nota SOAP
examOrders.listBySoapNote(soapNoteId)

// Listar por unidade
examOrders.listByUnit(unitId, status?)

// Atualizar status do pedido
examOrders.updateStatus(id, data)

// Cancelar pedido
examOrders.cancel(id)

// Deletar pedido
examOrders.delete(id)
```

## Exemplo de Uso

### React Component

```typescript
import { appointments, prescriptions, examOrders } from '@/lib/api';

export function PatientAppointments({ patientId }: { patientId: string }) {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [patientId]);

  async function loadAppointments() {
    setLoading(true);
    try {
      const data = await appointments.listByPatient(patientId);
      setAppts(data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAppointment(formData: any) {
    try {
      const newAppt = await appointments.create(formData);
      setAppts([...appts, newAppt]);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
  }

  return (
    <div>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul>
          {appts.map(appt => (
            <li key={appt.id}>
              {appt.date} - {appt.start_time} ({appt.type})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Autenticação

Todos os endpoints requerem um token JWT válido. O token é automaticamente incluído nos headers de cada requisição:

```typescript
Authorization: Bearer {token}
```

O token é armazenado em `localStorage` e gerenciado pela função `setToken()` e `getToken()`.

## Tratamento de Erros

Todas as chamadas da API lançam exceções com mensagens descritivas:

```typescript
try {
  const appt = await appointments.create(data);
} catch (error) {
  if (error instanceof Error) {
    console.error('Erro:', error.message);
  }
}
```

## Tipos TypeScript

Todos os tipos estão definidos em `src/lib/api.ts`:

- `AppointmentResponse`
- `PrescriptionResponse`
- `ExamOrderResponse`

Exemplo:

```typescript
import { AppointmentResponse } from '@/lib/api';

const appointment: AppointmentResponse = {
  id: 'uuid',
  patient_id: 'uuid',
  date: '2024-01-15',
  start_time: '10:00',
  end_time: '11:00',
  type: 'consulta',
  status: 'agendado',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};
```

## Requisitos de Banco de Dados

As tabelas devem estar criadas conforme definido em `backend/schema.sql`:

- `appointments`
- `prescriptions`
- `exam_orders`

Execute o arquivo de schema para criar as tabelas:

```bash
psql -U postgres -d khronos_med -f backend/schema.sql
```

## Variáveis de Ambiente

Frontend (`.env`):
```
VITE_API_URL=http://localhost:3000/api
```

Backend (`.env`):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/khronos_med
JWT_SECRET=seu_segredo_jwt
PORT=3000
```

## Próximos Passos

1. **Integração com UI**: Criar componentes React para cada módulo
2. **Formulários**: Implementar formulários de criação e edição
3. **Validação**: Adicionar validação de dados no frontend
4. **Persistência**: Implementar cache local para melhor UX
5. **Relatórios**: Criar relatórios e gráficos baseados nos dados
