export type UUID = string;

export interface Clinic {
  id: UUID;
  name: string;
  slug: string;
  cnpj: string;
  units: Unit[];
  plan: 'essencial' | 'profissional' | 'enterprise';
}

export interface Unit {
  id: UUID;
  name: string;
  address: string;
  phone: string;
}

export interface Professional {
  id: UUID;
  name: string;
  specialty: string;
  crm: string;
  color: string;
  avatar?: string;
  unitIds: UUID[];
  repasse: number; // %
}

export interface Patient {
  id: UUID;
  code: string;
  name: string;
  cpf: string;
  birth: string;
  sex: 'M' | 'F' | 'O';
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  emergencyContact: string;
  insurance?: string;
  insuranceCard?: string;
  allergies: string[];
  medications: string[];
  notes?: string;
  createdAt: string;
  lastVisit?: string;
}

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'aguardando'
  | 'em_atendimento'
  | 'atendido'
  | 'falta'
  | 'cancelado'
  | 'reagendado';

export interface Appointment {
  id: UUID;
  patientId: UUID;
  professionalId: UUID;
  unitId: UUID;
  date: string; // yyyy-mm-dd
  start: string; // HH:mm
  end: string;
  type: 'consulta' | 'retorno' | 'procedimento' | 'teleconsulta' | 'exame';
  insurance?: string;
  procedure?: string;
  value?: number;
  payment?: 'particular' | 'convenio' | 'cortesia';
  status: AppointmentStatus;
  notes?: string;
  teleUrl?: string;
}

export interface SOAPNote {
  id: UUID;
  patientId: UUID;
  professionalId: UUID;
  appointmentId?: UUID;
  date: string;
  signed: boolean;
  queixa: string;
  hda: string;
  antecedentes: string;
  medicamentos: string;
  alergias: string;
  habitos: string;
  // vitals
  pa?: string;
  fc?: string;
  fr?: string;
  temp?: string;
  spo2?: string;
  peso?: string;
  altura?: string;
  // SOAP
  subjetivo: string;
  objetivo: string;
  avaliacao: string;
  plano: string;
  hipotese?: string;
  diagnostico?: string; // CID
  conduta?: string;
  retorno?: string;
  anexos?: { name: string; url: string }[];
  adendos?: { date: string; by: string; text: string }[];
}

export interface Prescription {
  id: UUID;
  patientId: UUID;
  professionalId: UUID;
  date: string;
  items: PrescriptionItem[];
  observations?: string;
  type: 'simples' | 'especial' | 'antimicrobiano';
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
  notes?: string;
}

export interface ExamOrder {
  id: UUID;
  patientId: UUID;
  professionalId: UUID;
  date: string;
  exams: { name: string; code?: string; justification?: string; result?: string }[];
  status: 'solicitado' | 'em_andamento' | 'concluido';
}

export interface FinancialEntry {
  id: UUID;
  date: string;
  description: string;
  category: string;
  type: 'receita' | 'despesa';
  amount: number;
  status: 'pago' | 'pendente' | 'atrasado';
  method?: string;
  patientId?: UUID;
  professionalId?: UUID;
}

export interface WaitlistEntry {
  id: UUID;
  patientId: UUID;
  specialty: string;
  professionalId?: UUID;
  availability: string;
  priority: 'baixa' | 'media' | 'alta';
  createdAt: string;
  notes?: string;
}

export interface Insurance {
  id: UUID;
  name: string;
  cnpj: string;
  plans: string[];
  procedures: { code: string; name: string; value: number }[];
  deadline: number;
}

export interface StockItem {
  id: UUID;
  name: string;
  category: string;
  lot: string;
  expiry: string;
  supplier: string;
  quantity: number;
  min: number;
  unit: string;
}

export interface AuditLog {
  id: UUID;
  user: string;
  action: string;
  entity: string;
  entityId?: string;
  at: string;
}

export type Role = 'superadmin' | 'admin' | 'medico' | 'recepcao' | 'financeiro' | 'gestor' | 'enfermeiro';

export interface User {
  id: UUID;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  professionalId?: UUID;
}
