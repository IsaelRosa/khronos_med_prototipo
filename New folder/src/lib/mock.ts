import type {
  Appointment, FinancialEntry, Patient, Professional, SOAPNote, Prescription,
  ExamOrder, Insurance, StockItem, WaitlistEntry, Unit, Clinic, User, AuditLog
} from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

export const clinic: Clinic = {
  id: 'c1',
  name: 'Instituto Khronos de Saúde',
  slug: 'instituto-khronos',
  cnpj: '12.345.678/0001-90',
  plan: 'profissional',
  units: [
    { id: 'u1', name: 'Unidade Centro', address: 'Av. Paulista, 1.230 — Bela Vista, São Paulo/SP', phone: '(11) 3030-1200' },
    { id: 'u2', name: 'Unidade Vila Olímpia', address: 'R. Fidêncio Ramos, 100 — Vila Olímpia, São Paulo/SP', phone: '(11) 3030-4800' },
  ]
};

export const units: Unit[] = clinic.units;

export const user: User = {
  id: 'user-dr',
  name: 'Dra. Helena Albuquerque',
  email: 'helena@khronos.med.br',
  role: 'medico',
  professionalId: 'p1',
};

export const professionals: Professional[] = [
  { id: 'p1', name: 'Dra. Helena Albuquerque', specialty: 'Cardiologia', crm: 'CRM-SP 128.441', color: '#2563eb', unitIds: ['u1','u2'], repasse: 60 },
  { id: 'p2', name: 'Dr. Rafael Nakamura', specialty: 'Clínica Geral', crm: 'CRM-SP 204.102', color: '#06b6d4', unitIds: ['u1'], repasse: 55 },
  { id: 'p3', name: 'Dra. Camila Vieira', specialty: 'Dermatologia', crm: 'CRM-SP 188.776', color: '#f59e0b', unitIds: ['u2'], repasse: 65 },
  { id: 'p4', name: 'Dr. Gustavo Pêra', specialty: 'Ortopedia', crm: 'CRM-SP 141.909', color: '#10b981', unitIds: ['u1','u2'], repasse: 60 },
  { id: 'p5', name: 'Dra. Luiza Monteiro', specialty: 'Pediatria', crm: 'CRM-SP 231.556', color: '#ef4444', unitIds: ['u1'], repasse: 60 },
  { id: 'p6', name: 'Dr. André Reis', specialty: 'Psiquiatria', crm: 'CRM-SP 198.012', color: '#8b5cf6', unitIds: ['u2'], repasse: 70 },
];

export const specialties = [
  'Cardiologia','Clínica Geral','Dermatologia','Ortopedia','Pediatria','Psiquiatria',
  'Ginecologia','Endocrinologia','Oftalmologia','Nutrição'
];

const firstNames = ['Ana','Bruno','Camila','Daniel','Eduarda','Fernando','Gabriela','Henrique','Isabela','João','Karen','Lucas','Mariana','Nicolas','Olívia','Pedro','Quésia','Rafael','Sofia','Thiago','Úrsula','Victor','Wagner','Yasmin','Zilda','Beatriz','Caio','Diogo','Eloá','Felipe'];
const lastNames = ['Silva','Oliveira','Souza','Ferreira','Costa','Pereira','Martins','Rocha','Lima','Gomes','Carvalho','Araújo','Ribeiro','Monteiro','Barbosa','Cardoso','Cavalcanti','Teixeira','Moreira','Correia','Nunes','Dias','Macedo','Pires','Andrade'];

function pad(n: number) { return n.toString().padStart(2,'0'); }
function randomDate(start: Date, end: Date) {
  const d = new Date(start.getTime() + Math.random()*(end.getTime()-start.getTime()));
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

const insurances = ['Particular','Unimed','Bradesco Saúde','SulAmérica','Amil','Porto Seguro','NotreDame','Hapvida'];

export const patients: Patient[] = Array.from({length: 48}).map((_,i) => {
  const fn = firstNames[Math.floor(Math.random()*firstNames.length)];
  const ln1 = lastNames[Math.floor(Math.random()*lastNames.length)];
  const ln2 = lastNames[Math.floor(Math.random()*lastNames.length)];
  const sex = Math.random() > 0.5 ? 'F' : 'M';
  const birth = randomDate(new Date(1950,0,1), new Date(2015,11,31));
  return {
    id: `pt${i+1}`,
    code: `KH${(1000+i).toString()}`,
    name: `${fn} ${ln1} ${ln2}`,
    cpf: `${Math.floor(100+Math.random()*899)}.${Math.floor(100+Math.random()*899)}.${Math.floor(100+Math.random()*899)}-${Math.floor(10+Math.random()*89)}`,
    birth,
    sex: sex as 'M'|'F',
    phone: `(11) 9${Math.floor(1000+Math.random()*8999)}-${Math.floor(1000+Math.random()*8999)}`,
    whatsapp: `(11) 9${Math.floor(1000+Math.random()*8999)}-${Math.floor(1000+Math.random()*8999)}`,
    email: `${fn.toLowerCase()}.${ln1.toLowerCase()}@email.com`,
    address: `Rua ${ln2}, ${Math.floor(10+Math.random()*990)} — São Paulo/SP`,
    emergencyContact: `${ln2} — (11) 98${Math.floor(100+Math.random()*899)}-${Math.floor(1000+Math.random()*8999)}`,
    insurance: insurances[Math.floor(Math.random()*insurances.length)],
    insuranceCard: Math.random() > 0.3 ? `${Math.floor(100000+Math.random()*899999)}` : undefined,
    allergies: Math.random() > 0.7 ? ['Dipirona'] : [],
    medications: Math.random() > 0.6 ? ['Losartana 50mg'] : [],
    createdAt: randomDate(new Date(2023,0,1), new Date(2026,10,1)),
    lastVisit: randomDate(new Date(2026,6,1), new Date(2026,10,30)),
  };
});

// Today appointments — anchor to today's date
const today = new Date();
const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

function mkAppt(
  patientId: string, professionalId: string, date: string, start: string, duration: number,
  status: Appointment['status'], opts: Partial<Appointment> = {}
): Appointment {
  const [h,m] = start.split(':').map(Number);
  const endMin = h*60 + m + duration;
  const end = `${pad(Math.floor(endMin/60))}:${pad(endMin%60)}`;
  return {
    id: uid(),
    patientId, professionalId,
    unitId: opts.unitId ?? 'u1',
    date, start, end,
    type: opts.type ?? 'consulta',
    insurance: opts.insurance ?? 'Particular',
    procedure: opts.procedure ?? 'Consulta eletiva',
    value: opts.value ?? 380,
    payment: opts.payment ?? 'particular',
    status,
    notes: opts.notes,
    teleUrl: opts.teleUrl,
  };
}

export const appointments: Appointment[] = [
  mkAppt('pt1','p1',todayStr,'08:00',30,'atendido',{procedure:'Avaliação cardiológica',value:420}),
  mkAppt('pt3','p1',todayStr,'08:30',30,'atendido',{procedure:'Retorno — Hipertensão',type:'retorno',value:0,payment:'cortesia'}),
  mkAppt('pt5','p1',todayStr,'09:00',45,'em_atendimento',{procedure:'MAPA — leitura',value:520}),
  mkAppt('pt7','p1',todayStr,'09:45',30,'aguardando',{procedure:'Consulta eletiva'}),
  mkAppt('pt9','p1',todayStr,'10:30',30,'confirmado',{insurance:'Unimed',payment:'convenio',value:280}),
  mkAppt('pt11','p1',todayStr,'11:00',30,'confirmado'),
  mkAppt('pt13','p1',todayStr,'11:30',30,'agendado',{procedure:'Checkup executivo',value:650}),
  mkAppt('pt15','p1',todayStr,'14:00',30,'agendado',{type:'teleconsulta',teleUrl:'https://meet.khronos.med.br/sala/helena-128'}),
  mkAppt('pt17','p1',todayStr,'14:30',30,'falta'),
  mkAppt('pt19','p1',todayStr,'15:00',45,'agendado',{procedure:'Ecocardiograma',value:720}),
  mkAppt('pt21','p1',todayStr,'16:00',30,'cancelado'),
  mkAppt('pt23','p1',todayStr,'16:30',30,'agendado'),
  mkAppt('pt25','p1',todayStr,'17:00',30,'agendado',{insurance:'Bradesco Saúde',payment:'convenio'}),
  // Other professionals today
  mkAppt('pt2','p2',todayStr,'08:30',30,'confirmado'),
  mkAppt('pt4','p2',todayStr,'09:00',30,'atendido'),
  mkAppt('pt6','p2',todayStr,'10:00',30,'aguardando'),
  mkAppt('pt8','p3',todayStr,'14:00',40,'agendado',{procedure:'Mapeamento de pele',value:380,unitId:'u2'}),
  mkAppt('pt10','p3',todayStr,'15:00',30,'agendado',{unitId:'u2'}),
  mkAppt('pt12','p4',todayStr,'09:30',30,'atendido'),
  mkAppt('pt14','p4',todayStr,'10:30',30,'confirmado'),
  mkAppt('pt16','p5',todayStr,'11:00',30,'agendado',{procedure:'Puericultura'}),
  mkAppt('pt18','p6',todayStr,'16:00',50,'agendado',{procedure:'Terapia cognitiva',value:420,unitId:'u2'}),
];

// Add upcoming week for demo of week/month views
for (let d=1; d<=14; d++) {
  const dt = new Date(today); dt.setDate(dt.getDate()+d);
  const ds = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
  const count = Math.floor(2 + Math.random()*5);
  for (let i=0;i<count;i++) {
    const h = 8 + Math.floor(Math.random()*9);
    const m = Math.random() > 0.5 ? '00' : '30';
    const p = professionals[Math.floor(Math.random()*professionals.length)];
    const pt = patients[Math.floor(Math.random()*patients.length)];
    appointments.push(mkAppt(pt.id,p.id,ds,`${pad(h)}:${m}`,30,'agendado'));
  }
}

export const soapNotes: SOAPNote[] = [
  {
    id:'s1', patientId:'pt1', professionalId:'p1', date:'2026-11-18', signed:true,
    queixa:'Dor retroesternal em aperto há 3 dias, piora aos esforços.',
    hda:'Paciente refere episódios recorrentes, duração 5-10 min, associados a sudorese fria.',
    antecedentes:'HAS, DLP, tabagista (10 maços-ano).',
    medicamentos:'Losartana 50mg 1x/dia; Sinvastatina 20mg à noite.',
    alergias:'Nega.',
    habitos:'Sedentário. Etilismo social.',
    pa:'148/92 mmHg', fc:'88', fr:'18', temp:'36.5', spo2:'97', peso:'82', altura:'1.74',
    subjetivo:'Dor torácica típica, sem irradiação, alivia com repouso.',
    objetivo:'BRNF 2T s/ sopros. MV + sem RA.',
    avaliacao:'Angina estável provável. Investigação não-invasiva indicada.',
    plano:'Solicitar teste ergométrico e perfil lipídico. Ajuste medicamentoso.',
    hipotese:'Angina estável CCS II',
    diagnostico:'I20.9', conduta:'Retorno em 15 dias com exames.', retorno:'2026-12-02',
  }
];

export const prescriptions: Prescription[] = [
  { id:'rx1', patientId:'pt1', professionalId:'p1', date:'2026-11-18', type:'simples',
    items:[
      { medication:'Losartana potássica 50mg', dosage:'1 comprimido', route:'Via oral', frequency:'1x ao dia (manhã)', duration:'Uso contínuo', quantity:'30 comprimidos' },
      { medication:'Ácido acetilsalicílico 100mg', dosage:'1 comprimido', route:'Via oral', frequency:'1x ao dia (após almoço)', duration:'Uso contínuo', quantity:'30 comprimidos' },
    ],
    observations:'Manter dieta hipossódica e caminhada 30min/dia.'
  }
];

export const examOrders: ExamOrder[] = [
  { id:'ex1', patientId:'pt1', professionalId:'p1', date:'2026-11-18', status:'em_andamento',
    exams:[
      { name:'Teste ergométrico', code:'4.11.01.02-2', justification:'Investigação de angina' },
      { name:'Perfil lipídico completo', code:'4.03.02.03-7' },
      { name:'Hemograma completo', code:'4.03.01.01-6' },
    ]
  }
];

export const financial: FinancialEntry[] = [
  { id:'f1', date: todayStr, description:'Consulta — Ana Silva', category:'Consultas', type:'receita', amount: 420, status:'pago', method:'PIX', patientId:'pt1', professionalId:'p1' },
  { id:'f2', date: todayStr, description:'Consulta — João Souza', category:'Consultas', type:'receita', amount: 380, status:'pago', method:'Cartão', patientId:'pt3', professionalId:'p1' },
  { id:'f3', date: todayStr, description:'Ecocardiograma — Pedro Lima', category:'Procedimentos', type:'receita', amount: 720, status:'pendente', patientId:'pt5', professionalId:'p1' },
  { id:'f4', date: todayStr, description:'Aluguel — Unidade Centro', category:'Infraestrutura', type:'despesa', amount: 12800, status:'pago', method:'Boleto' },
  { id:'f5', date: todayStr, description:'Material médico — Fornecedor Hospitalar', category:'Insumos', type:'despesa', amount: 2340, status:'pendente' },
  { id:'f6', date: '2026-11-15', description:'Faturamento convênio Unimed', category:'Convênios', type:'receita', amount: 18420, status:'pendente' },
  { id:'f7', date: '2026-11-10', description:'Repasse — Dr. Nakamura', category:'Repasse médico', type:'despesa', amount: 9240, status:'pago', professionalId:'p2' },
  { id:'f8', date: '2026-11-05', description:'Folha de pagamento', category:'RH', type:'despesa', amount: 38400, status:'pago' },
];

export const waitlist: WaitlistEntry[] = [
  { id:'w1', patientId:'pt4', specialty:'Cardiologia', professionalId:'p1', availability:'Manhãs/quartas', priority:'alta', createdAt:'2026-11-10', notes:'Encaixe assim que possível.' },
  { id:'w2', patientId:'pt20', specialty:'Dermatologia', availability:'Tardes', priority:'media', createdAt:'2026-11-12' },
  { id:'w3', patientId:'pt30', specialty:'Ortopedia', professionalId:'p4', availability:'Qualquer', priority:'baixa', createdAt:'2026-11-14' },
];

export const insuranceProviders: Insurance[] = [
  { id:'i1', name:'Unimed', cnpj:'00.123.456/0001-00', plans:['Nacional','Estadual','Ouro'], deadline: 30,
    procedures: [
      { code:'10101012', name:'Consulta em consultório', value: 180 },
      { code:'40901408', name:'Eletrocardiograma', value: 95 },
      { code:'40901467', name:'Ecocardiograma transtorácico', value: 520 },
    ]},
  { id:'i2', name:'Bradesco Saúde', cnpj:'00.234.567/0001-00', plans:['Nacional Flex','Top'], deadline: 45,
    procedures: [
      { code:'10101012', name:'Consulta em consultório', value: 220 },
    ]},
  { id:'i3', name:'SulAmérica', cnpj:'00.345.678/0001-00', plans:['Especial 100','Prestige'], deadline: 30,
    procedures: [
      { code:'10101012', name:'Consulta em consultório', value: 210 },
    ]},
];

export const stock: StockItem[] = [
  { id:'st1', name:'Dipirona 500mg (amp)', category:'Medicamento', lot:'LT-20425', expiry:'2027-06-30', supplier:'Hypera', quantity: 48, min: 30, unit:'amp' },
  { id:'st2', name:'Soro fisiológico 500ml', category:'Material', lot:'LT-10022', expiry:'2027-02-10', supplier:'JP Farma', quantity: 22, min: 40, unit:'frasco' },
  { id:'st3', name:'Luvas de procedimento M', category:'EPI', lot:'LT-33442', expiry:'2028-01-15', supplier:'Cremer', quantity: 1240, min: 500, unit:'un' },
  { id:'st4', name:'Eletrodo descartável', category:'Material', lot:'LT-77881', expiry:'2026-12-20', supplier:'3M', quantity: 86, min: 100, unit:'un' },
  { id:'st5', name:'Adrenalina 1mg/ml (amp)', category:'Medicamento', lot:'LT-00110', expiry:'2027-09-10', supplier:'Hypofarma', quantity: 14, min: 20, unit:'amp' },
];

export const audits: AuditLog[] = [
  { id:'a1', user:'Dra. Helena', action:'Assinou prontuário', entity:'SOAPNote', entityId:'s1', at:'2026-11-18 11:42' },
  { id:'a2', user:'Recepção — Carla', action:'Criou agendamento', entity:'Appointment', at: `${todayStr} 07:12` },
  { id:'a3', user:'Dr. Nakamura', action:'Emitiu prescrição', entity:'Prescription', entityId:'rx1', at:'2026-11-17 16:04' },
  { id:'a4', user:'Financeiro — Rodrigo', action:'Confirmou pagamento', entity:'Financial', entityId:'f1', at: `${todayStr} 09:45` },
];

export const commonMedications = [
  { name:'Losartana potássica 50mg', dosages:['25mg','50mg','100mg'], defaultFreq:'1x ao dia' },
  { name:'Atenolol 25mg', dosages:['25mg','50mg'], defaultFreq:'1x ao dia' },
  { name:'Dipirona 500mg', dosages:['500mg'], defaultFreq:'6/6h se dor' },
  { name:'Amoxicilina 500mg', dosages:['500mg','875mg'], defaultFreq:'8/8h' },
  { name:'Omeprazol 20mg', dosages:['20mg','40mg'], defaultFreq:'1x ao dia em jejum' },
  { name:'Metformina 850mg', dosages:['500mg','850mg'], defaultFreq:'2x ao dia' },
  { name:'Sinvastatina 20mg', dosages:['10mg','20mg','40mg'], defaultFreq:'1x ao dia à noite' },
  { name:'Ácido acetilsalicílico 100mg', dosages:['100mg'], defaultFreq:'1x ao dia' },
  { name:'Paracetamol 750mg', dosages:['500mg','750mg'], defaultFreq:'6/6h se dor' },
  { name:'Loratadina 10mg', dosages:['10mg'], defaultFreq:'1x ao dia' },
];

export const examCatalog = [
  { code:'4.03.01.01-6', name:'Hemograma completo', category:'Laboratorial' },
  { code:'4.03.02.03-7', name:'Perfil lipídico', category:'Laboratorial' },
  { code:'4.03.02.26-6', name:'Glicemia de jejum', category:'Laboratorial' },
  { code:'4.03.05.59-8', name:'TSH ultrassensível', category:'Laboratorial' },
  { code:'4.11.01.02-2', name:'Teste ergométrico', category:'Cardiológico' },
  { code:'4.11.02.03-7', name:'Ecocardiograma transtorácico', category:'Cardiológico' },
  { code:'4.08.01.03-4', name:'Raio-X tórax PA e perfil', category:'Imagem' },
  { code:'4.09.01.12-3', name:'Ultrassonografia de abdome', category:'Imagem' },
  { code:'4.10.01.09-9', name:'Ressonância de crânio', category:'Imagem' },
];
