-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'recepcao',
  avatar TEXT,
  professional_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  birth DATE,
  sex CHAR(1),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  emergency_contact VARCHAR(255),
  insurance VARCHAR(255),
  insurance_card VARCHAR(255),
  allergies JSONB DEFAULT '[]'::jsonb,
  medications JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOAP Notes table
CREATE TABLE IF NOT EXISTS soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES users(id),
  appointment_id UUID,
  
  -- Complaint and history
  queixa TEXT NOT NULL,
  hda TEXT,
  antecedentes TEXT,
  medicamentos TEXT,
  alergias TEXT,
  habitos TEXT,
  
  -- Vitals
  pa VARCHAR(20),
  fc VARCHAR(20),
  fr VARCHAR(20),
  temp VARCHAR(20),
  spo2 VARCHAR(20),
  peso VARCHAR(20),
  altura VARCHAR(20),
  
  -- SOAP sections
  subjetivo TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  avaliacao TEXT NOT NULL,
  plano TEXT NOT NULL,
  hipotese TEXT,
  diagnostico VARCHAR(50),
  conduta TEXT,
  retorno VARCHAR(100),
  
  -- Attachments and amendments
  anexos JSONB DEFAULT '[]'::jsonb,
  adendos JSONB DEFAULT '[]'::jsonb,
  
  -- Signing
  signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES users(id),
  unit_id VARCHAR(50),
  
  -- Schedule
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Details
  type VARCHAR(50) NOT NULL DEFAULT 'consulta', -- consulta, retorno, procedimento, teleconsulta, exame
  specialty VARCHAR(100),
  procedure VARCHAR(255),
  
  -- Insurance and payment
  insurance VARCHAR(255),
  value DECIMAL(10, 2),
  payment_method VARCHAR(50), -- particular, convenio, cortesia
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'agendado', -- agendado, confirmado, aguardando, em_atendimento, atendido, falta, cancelado, reagendado
  notes TEXT,
  
  -- Telehealth
  telehealth_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES users(id),
  soap_note_id UUID REFERENCES soap_notes(id),
  
  -- Prescription details
  date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {medication, dosage, route, frequency, duration, quantity, notes}
  observations TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'simples', -- simples, especial, antimicrobiano
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_until DATE,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'ativa', -- ativa, cancelada, expirada
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Orders table
CREATE TABLE IF NOT EXISTS exam_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES users(id),
  soap_note_id UUID REFERENCES soap_notes(id),
  
  -- Order details
  date DATE NOT NULL,
  exams JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, code, justification, result, result_date}
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'solicitado', -- solicitado, em_andamento, concluido, cancelado
  observations TEXT,
  
  -- Lab info
  lab_name VARCHAR(255),
  lab_phone VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_soap_notes_patient_id ON soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_professional_id ON soap_notes(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_exam_orders_patient_id ON exam_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_orders_status ON exam_orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
