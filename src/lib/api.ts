/**
 * API Client for Khronos Backend
 * Handles all HTTP requests to the backend server
 */

const API_BASE = 'http://localhost:3000/api';

// Token management
export function getToken(): string | null {
  return localStorage.getItem('khronos_token');
}

export function setToken(token: string) {
  localStorage.setItem('khronos_token', token);
}

export function clearToken() {
  localStorage.removeItem('khronos_token');
}

// Helper para fazer requisições
async function request<T>(
  method: string,
  endpoint: string,
  body?: any
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// 🔐 AUTENTICAÇÃO
// ============================================================================

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const auth = {
  register: (email: string, name: string, password: string, role: string) =>
    request<AuthResponse>('POST', '/auth/register', { email, name, password, role }),

  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }),

  profile: () =>
    request<any>('GET', '/auth/profile'),
};

// ============================================================================
// 👥 PACIENTES
// ============================================================================

export interface PatientResponse {
  id: string;
  code: string;
  name: string;
  cpf: string;
  birth: string;
  sex: 'M' | 'F' | 'O';
  phone: string;
  email: string;
  address: string;
  insurance?: string;
  allergies: string[];
  medications: string[];
  createdAt: string;
}

export const patients = {
  create: (data: {
    name: string;
    cpf: string;
    birth: string;
    sex: 'M' | 'F' | 'O';
    phone: string;
    email: string;
    address: string;
    insurance?: string;
    allergies?: string[];
    medications?: string[];
  }) =>
    request<PatientResponse>('POST', '/patients', data),

  list: () =>
    request<PatientResponse[]>('GET', '/patients'),

  getById: (id: string) =>
    request<PatientResponse>('GET', `/patients/${id}`),

  search: (query: string) =>
    request<PatientResponse[]>('GET', `/patients/search?q=${encodeURIComponent(query)}`),

  update: (id: string, data: Partial<PatientResponse>) =>
    request<PatientResponse>('PUT', `/patients/${id}`, data),

  delete: (id: string) =>
    request<void>('DELETE', `/patients/${id}`),
};

// ============================================================================
// 📝 NOTAS SOAP
// ============================================================================

export interface SOAPResponse {
  id: string;
  patientId: string;
  professionalId: string;
  date: string;
  signed: boolean;
  signed_at?: string;
  subjetivo: string;
  objetivo: string;
  avaliacao: string;
  plano: string;
  diagnostico?: string;
  pa?: string;
  fc?: string;
  fr?: string;
  temp?: string;
  spo2?: string;
  peso?: string;
  altura?: string;
  createdAt: string;
  updatedAt: string;
}

export const soap = {
  create: (data: {
    patientId: string;
    subjetivo: string;
    objetivo: string;
    avaliacao: string;
    plano: string;
    diagnostico?: string;
    pa?: string;
    fc?: string;
    fr?: string;
    temp?: string;
    spo2?: string;
    peso?: string;
    altura?: string;
  }) =>
    request<SOAPResponse>('POST', '/soap', data),

  listByPatient: (patientId: string) =>
    request<SOAPResponse[]>('GET', `/soap/patient/${patientId}`),

  getById: (id: string) =>
    request<SOAPResponse>('GET', `/soap/${id}`),

  update: (id: string, data: Partial<SOAPResponse>) =>
    request<SOAPResponse>('PUT', `/soap/${id}`, data),

  delete: (id: string) =>
    request<void>('DELETE', `/soap/${id}`),

  sign: (id: string) =>
    request<SOAPResponse>('POST', `/soap/${id}/sign`, {}),
};

// ============================================================================
// 📅 AGENDAMENTOS
// ============================================================================

export interface AppointmentResponse {
  id: string;
  patient_id: string;
  professional_id: string;
  unit_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'consulta' | 'retorno' | 'procedimento' | 'teleconsulta' | 'exame';
  specialty?: string;
  procedure?: string;
  insurance?: string;
  value?: number;
  payment_method?: string;
  notes?: string;
  telehealth_url?: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'nao_compareceu' | 'cancelado';
  created_at: string;
  updated_at: string;
}

export const appointments = {
  create: (data: {
    patient_id: string;
    professional_id: string;
    unit_id: string;
    date: string;
    start_time: string;
    end_time: string;
    type: 'consulta' | 'retorno' | 'procedimento' | 'teleconsulta' | 'exame';
    specialty?: string;
    procedure?: string;
    insurance?: string;
    value?: number;
    payment_method?: string;
    notes?: string;
    telehealth_url?: string;
  }) =>
    request<AppointmentResponse>('POST', '/appointments', data),

  listByPatient: (patientId: string) =>
    request<AppointmentResponse[]>('GET', `/appointments/patient/${patientId}`),

  getById: (id: string) =>
    request<AppointmentResponse>('GET', `/appointments/${id}`),

  listByDateRange: (startDate: string, endDate: string, professionalId?: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (professionalId) params.append('professional_id', professionalId);
    return request<AppointmentResponse[]>('GET', `/appointments/range?${params}`);
  },

  update: (id: string, data: Partial<AppointmentResponse>) =>
    request<AppointmentResponse>('PUT', `/appointments/${id}`, data),

  cancel: (id: string) =>
    request<AppointmentResponse>('DELETE', `/appointments/${id}`),

  getTodayAppointments: (professionalId?: string) => {
    const params = new URLSearchParams();
    if (professionalId) params.append('professional_id', professionalId);
    return request<AppointmentResponse[]>('GET', `/appointments/today${params.toString() ? '?' + params : ''}`);
  },
};

// ============================================================================
// 💊 PRESCRIÇÕES
// ============================================================================

export interface PrescriptionResponse {
  id: string;
  patient_id: string;
  professional_id: string;
  soap_note_id?: string;
  date: string;
  items: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
  }>;
  observations?: string;
  type: 'simples' | 'controlada';
  valid_from?: string;
  valid_until?: string;
  status: 'ativa' | 'cumprida' | 'cancelada';
  created_at: string;
  updated_at: string;
}

export const prescriptions = {
  create: (data: {
    patient_id: string;
    professional_id: string;
    soap_note_id?: string;
    date: string;
    items: Array<{
      medicine: string;
      dosage: string;
      frequency: string;
      duration: string;
      route?: string;
    }>;
    observations?: string;
    type?: 'simples' | 'controlada';
    valid_from?: string;
    valid_until?: string;
  }) =>
    request<PrescriptionResponse>('POST', '/prescriptions', data),

  listByPatient: (patientId: string) =>
    request<PrescriptionResponse[]>('GET', `/prescriptions/patient/${patientId}`),

  getById: (id: string) =>
    request<PrescriptionResponse>('GET', `/prescriptions/${id}`),

  listActivePrescriptions: (patientId: string) =>
    request<PrescriptionResponse[]>('GET', `/prescriptions/patient/${patientId}/active`),

  listBySoapNote: (soapNoteId: string) =>
    request<PrescriptionResponse[]>('GET', `/prescriptions/soap-note/${soapNoteId}`),

  update: (id: string, data: Partial<PrescriptionResponse>) =>
    request<PrescriptionResponse>('PUT', `/prescriptions/${id}`, data),

  cancel: (id: string) =>
    request<PrescriptionResponse>('PATCH', `/prescriptions/${id}/cancel`, {}),

  delete: (id: string) =>
    request<void>('DELETE', `/prescriptions/${id}`),
};

// ============================================================================
// 🧪 PEDIDOS DE EXAMES
// ============================================================================

export interface ExamOrderResponse {
  id: string;
  patient_id: string;
  professional_id: string;
  soap_note_id?: string;
  date: string;
  exams: Array<{
    name: string;
    code?: string;
    type?: string;
  }>;
  priority: 'normal' | 'urgente' | 'emergencia';
  observations?: string;
  unit_id?: string;
  result_data?: any;
  status: 'solicitado' | 'em_andamento' | 'concluido' | 'cancelado';
  created_at: string;
  updated_at: string;
}

export const examOrders = {
  create: (data: {
    patient_id: string;
    professional_id: string;
    soap_note_id?: string;
    date: string;
    exams: Array<{
      name: string;
      code?: string;
      type?: string;
    }>;
    priority?: 'normal' | 'urgente' | 'emergencia';
    observations?: string;
    unit_id?: string;
  }) =>
    request<ExamOrderResponse>('POST', '/exam-orders', data),

  listByPatient: (patientId: string) =>
    request<ExamOrderResponse[]>('GET', `/exam-orders/patient/${patientId}`),

  getById: (id: string) =>
    request<ExamOrderResponse>('GET', `/exam-orders/${id}`),

  listPending: (professionalId?: string) => {
    const params = new URLSearchParams();
    if (professionalId) params.append('professional_id', professionalId);
    return request<ExamOrderResponse[]>('GET', `/exam-orders/pending${params.toString() ? '?' + params : ''}`);
  },

  listBySoapNote: (soapNoteId: string) =>
    request<ExamOrderResponse[]>('GET', `/exam-orders/soap-note/${soapNoteId}`),

  listByUnit: (unitId: string, status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return request<ExamOrderResponse[]>('GET', `/exam-orders/unit/${unitId}${params.toString() ? '?' + params : ''}`);
  },

  updateStatus: (id: string, data: { status: string; result_data?: any; observations?: string }) =>
    request<ExamOrderResponse>('PUT', `/exam-orders/${id}`, data),

  cancel: (id: string) =>
    request<ExamOrderResponse>('PATCH', `/exam-orders/${id}/cancel`, {}),

  delete: (id: string) =>
    request<void>('DELETE', `/exam-orders/${id}`),
};

// ============================================================================
// 📊 AUDITORIA
// ============================================================================

export interface AuditResponse {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id?: string;
  created_at: string;
}

export const audit = {
  list: () =>
    request<AuditResponse[]>('GET', '/audit'),

  listByEntity: (entity: string, entityId: string) =>
    request<AuditResponse[]>('GET', `/audit/${entity}/${entityId}`),
};

// ============================================================================
// 🏥 SAÚDE DO SERVIDOR
// ============================================================================

export const health = {
  check: () =>
    request<{ status: string; timestamp: string }>('GET', '/health'),
};

