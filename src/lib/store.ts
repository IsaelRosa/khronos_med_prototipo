import { useSyncExternalStore } from 'react';
import {
  appointments as seedAppointments, patients as seedPatients, professionals as seedProfessionals,
  soapNotes as seedSoap, prescriptions as seedRx, examOrders as seedExams, financial as seedFin,
  waitlist as seedWait, insuranceProviders as seedIns, stock as seedStock, audits as seedAudits,
  user as seedUser, clinic as seedClinic, units as seedUnits
} from './mock';
import type {
  Appointment, Patient, Professional, SOAPNote, Prescription, ExamOrder, FinancialEntry,
  WaitlistEntry, Insurance, StockItem, AuditLog, User, Unit, Clinic
} from './types';

interface State {
  clinic: Clinic;
  units: Unit[];
  activeUnitId: string;
  user: User;
  appointments: Appointment[];
  patients: Patient[];
  professionals: Professional[];
  soapNotes: SOAPNote[];
  prescriptions: Prescription[];
  examOrders: ExamOrder[];
  financial: FinancialEntry[];
  waitlist: WaitlistEntry[];
  insurances: Insurance[];
  stock: StockItem[];
  audits: AuditLog[];
  notifications: { id:string; title:string; body:string; at:string; read:boolean; kind:'info'|'warn'|'success' }[];
}

const LS_KEY = 'khronos-state-v1';

function loadInitial(): State {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    clinic: seedClinic,
    units: seedUnits,
    activeUnitId: seedUnits[0].id,
    user: seedUser,
    appointments: seedAppointments,
    patients: seedPatients,
    professionals: seedProfessionals,
    soapNotes: seedSoap,
    prescriptions: seedRx,
    examOrders: seedExams,
    financial: seedFin,
    waitlist: seedWait,
    insurances: seedIns,
    stock: seedStock,
    audits: seedAudits,
    notifications: [
      { id:'n1', title:'Paciente aguardando', body:'Pedro Lima está na sala de espera há 7 minutos.', at:'agora', read:false, kind:'warn' },
      { id:'n2', title:'Confirmação WhatsApp', body:'8 confirmações automáticas recebidas hoje.', at:'10 min', read:false, kind:'success' },
      { id:'n3', title:'Estoque baixo', body:'Soro fisiológico 500ml abaixo do mínimo.', at:'1h', read:false, kind:'warn' },
      { id:'n4', title:'Novo agendamento online', body:'Beatriz Araújo agendou para amanhã 09:30.', at:'2h', read:true, kind:'info' },
    ]
  };
}

let state: State = loadInitial();
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  persist();
  listeners.forEach(l => l());
}

export function getState() { return state; }

// Wrapper to properly handle useSyncExternalStore - avoid infinite loops
// when selector returns new array/object by using referential equality on primitives
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => selector(state),
    () => selector(state),
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const actions = {
  setActiveUnit: (id: string) => setState(s => ({ ...s, activeUnitId: id })),
  markNotificationRead: (id: string) => setState(s => ({
    ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAllRead: () => setState(s => ({ ...s, notifications: s.notifications.map(n => ({...n, read: true})) })),

  addAppointment: (a: Omit<Appointment,'id'>) => {
    const id = uid();
    setState(s => ({ ...s, appointments: [...s.appointments, { ...a, id }] }));
    return id;
  },
  updateAppointment: (id: string, patch: Partial<Appointment>) => setState(s => ({
    ...s, appointments: s.appointments.map(a => a.id === id ? { ...a, ...patch } : a)
  })),
  deleteAppointment: (id: string) => setState(s => ({
    ...s, appointments: s.appointments.filter(a => a.id !== id)
  })),

  addPatient: (p: Omit<Patient,'id'|'code'|'createdAt'>) => {
    const id = uid();
    const code = `KH${1100 + Math.floor(Math.random()*8000)}`;
    setState(s => ({ ...s, patients: [{ ...p, id, code, createdAt: new Date().toISOString().slice(0,10) }, ...s.patients] }));
    return id;
  },
  updatePatient: (id: string, patch: Partial<Patient>) => setState(s => ({
    ...s, patients: s.patients.map(p => p.id === id ? { ...p, ...patch } : p)
  })),

  addSOAP: (n: Omit<SOAPNote,'id'>) => {
    const id = uid();
    setState(s => ({ ...s, soapNotes: [...s.soapNotes, { ...n, id }] }));
    return id;
  },
  addAdendo: (noteId: string, text: string, by: string) => setState(s => ({
    ...s,
    soapNotes: s.soapNotes.map(n => n.id === noteId ? { ...n, adendos: [...(n.adendos||[]), { date: new Date().toISOString(), by, text }] } : n)
  })),

  addPrescription: (p: Omit<Prescription,'id'>) => {
    const id = uid();
    setState(s => ({ ...s, prescriptions: [...s.prescriptions, { ...p, id }] }));
    return id;
  },

  addExam: (e: Omit<ExamOrder,'id'>) => {
    const id = uid();
    setState(s => ({ ...s, examOrders: [...s.examOrders, { ...e, id }] }));
    return id;
  },

  addFinancial: (f: Omit<FinancialEntry,'id'>) => {
    const id = uid();
    setState(s => ({ ...s, financial: [...s.financial, { ...f, id }] }));
    return id;
  },
  updateFinancial: (id: string, patch: Partial<FinancialEntry>) => setState(s => ({
    ...s, financial: s.financial.map(f => f.id === id ? { ...f, ...patch } : f)
  })),

  addWaitlist: (w: Omit<WaitlistEntry,'id'>) => {
    const id = uid();
    setState(s => ({ ...s, waitlist: [...s.waitlist, { ...w, id }] }));
    return id;
  },

  updateStock: (id: string, patch: Partial<StockItem>) => setState(s => ({
    ...s, stock: s.stock.map(i => i.id === id ? { ...i, ...patch } : i)
  })),

  resetDemo: () => {
    localStorage.removeItem(LS_KEY);
    state = loadInitial();
    listeners.forEach(l => l());
  }
};
