import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, actions } from '../lib/store';
import { Card, PageHeader, Button, Badge, Field, inputCls, textareaCls } from '../components/ui';
import { STATUS_META } from '../lib/statuses';
import { fmtDate, age, todayISO, cls } from '../lib/utils';
import {
  Play, Pause, Square, Save, Shield, FileSignature, AlertTriangle,
  Pill, Microscope, Heart, Thermometer, Activity, Printer, Stethoscope
} from 'lucide-react';

export default function Attendance() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const appointments = useStore(s => s.appointments);
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const soapNotes = useStore(s => s.soapNotes);

  // Pick appointment: route id, or first em_atendimento today, or first aguardando
  const activeAppt = useMemo(() => {
    if (appointmentId) return appointments.find(a => a.id === appointmentId);
    const today = todayISO();
    return appointments.find(a => a.date === today && a.status === 'em_atendimento') ||
           appointments.find(a => a.date === today && a.status === 'aguardando');
  }, [appointments, appointmentId]);

  const patient = activeAppt ? patients.find(p => p.id === activeAppt.patientId) : undefined;
  const professional = activeAppt ? professionals.find(p => p.id === activeAppt.professionalId) : undefined;
  const patientHistory = patient ? soapNotes.filter(n => n.patientId === patient.id) : [];

  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // SOAP form
  const [note, setNote] = useState({
    queixa:'', hda:'', antecedentes:'', medicamentos:'', alergias:'', habitos:'',
    pa:'', fc:'', fr:'', temp:'', spo2:'', peso:'', altura:'',
    subjetivo:'', objetivo:'', avaliacao:'', plano:'',
    hipotese:'', diagnostico:'', conduta:'', retorno:''
  });

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds(s => s+1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (patient) {
      setNote(n => ({ ...n,
        alergias: patient.allergies.join(', ') || 'Nega.',
        medicamentos: patient.medications.join(', ') || 'Nega.',
      }));
    }
  }, [patient?.id]);

  function fmtTime(s: number) {
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s%60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  function start() {
    if (!activeAppt) return;
    actions.updateAppointment(activeAppt.id, { status: 'em_atendimento' });
    setRunning(true);
  }

  function save(signed: boolean) {
    if (!activeAppt || !patient || !professional) return;
    actions.addSOAP({
      patientId: patient.id,
      professionalId: professional.id,
      appointmentId: activeAppt.id,
      date: todayISO(),
      signed,
      ...note,
    });
    actions.updateAppointment(activeAppt.id, { status: 'atendido' });
    actions.addFinancial({
      date: todayISO(),
      description: `Atendimento — ${patient.name}`,
      category: activeAppt.insurance === 'Particular' ? 'Consultas' : 'Convênios',
      type: 'receita',
      amount: activeAppt.value || 0,
      status: activeAppt.payment === 'convenio' ? 'pendente' : 'pago',
      patientId: patient.id,
      professionalId: professional.id,
      method: activeAppt.payment === 'convenio' ? 'Convênio' : 'PIX'
    });
    navigate('/agenda');
  }

  if (!activeAppt || !patient || !professional) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Card className="p-12 text-center">
          <Stethoscope className="size-10 mx-auto text-ink-300 mb-3" />
          <h2 className="font-display text-xl text-ink-800">Nenhum paciente em atendimento</h2>
          <p className="text-sm text-ink-500 mt-1 mb-4">Selecione um paciente na agenda para iniciar.</p>
          <Button onClick={() => navigate('/agenda')}>Ir para agenda</Button>
        </Card>
      </div>
    );
  }

  const st = STATUS_META[activeAppt.status];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Atendimento em andamento" title={`Consulta — ${patient.name}`} subtitle={`${professional.name} · ${professional.specialty} · ${activeAppt.procedure}`} />

      {/* Timer bar */}
      <Card className="p-4 mb-6 bg-gradient-to-r from-brand-700 to-brand-900 text-white flex items-center gap-4">
        <div className="relative">
          <div className={cls('size-3 rounded-full bg-aqua-400 text-aqua-400', running && 'pulse-dot relative')}>
            {running && <span />}
          </div>
        </div>
        <div className="font-mono text-2xl tabular-nums">{fmtTime(seconds)}</div>
        <span className={cls('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', 'bg-white/10 text-white')}>
          <span className={cls('size-1.5 rounded-full', st.dot)} /> {st.label}
        </span>
        <div className="flex-1 text-sm text-brand-100">Início: {activeAppt.start} · Previsão: {activeAppt.end}</div>
        {!running ? (
          <Button variant="success" size="sm" icon={<Play className="size-4" />} onClick={start}>Iniciar</Button>
        ) : (
          <Button variant="secondary" size="sm" icon={<Pause className="size-4" />} onClick={() => setRunning(false)}>Pausar</Button>
        )}
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: patient quick info */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Card className="p-5">
            <div className="size-14 rounded-xl bg-gradient-to-br from-brand-500 to-aqua-500 grid place-items-center text-white font-display text-lg mb-3">
              {patient.name.split(' ').slice(0,2).map(n => n[0]).join('')}
            </div>
            <div className="font-display text-lg text-ink-800">{patient.name}</div>
            <div className="text-xs text-ink-500">{age(patient.birth)} anos · {patient.sex === 'F' ? 'Feminino' : 'Masculino'}</div>
            <div className="text-xs text-ink-500 font-mono mt-1">{patient.code}</div>
            <div className="mt-4 pt-4 border-t border-ink-100 space-y-2">
              {patient.allergies.length > 0 && (
                <div className="flex items-start gap-2"><AlertTriangle className="size-4 text-flame-500 mt-0.5" /><div><div className="text-[11px] uppercase tracking-wider text-flame-600 font-semibold">Alergias</div><div className="text-xs text-ink-700">{patient.allergies.join(', ')}</div></div></div>
              )}
              {patient.medications.length > 0 && (
                <div className="flex items-start gap-2"><Pill className="size-4 text-brand-500 mt-0.5" /><div><div className="text-[11px] uppercase tracking-wider text-brand-600 font-semibold">Em uso</div><div className="text-xs text-ink-700">{patient.medications.join(', ')}</div></div></div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-2">Histórico</div>
            {patientHistory.length === 0 && <div className="text-xs text-ink-500">Primeira consulta</div>}
            {patientHistory.slice(-3).reverse().map(h => (
              <div key={h.id} className="py-2 border-t border-ink-100 first:border-0 first:pt-0">
                <div className="text-xs text-ink-500">{fmtDate(h.date)}</div>
                <div className="text-sm text-ink-800">{h.hipotese || h.avaliacao.slice(0, 60)}</div>
              </div>
            ))}
          </Card>
        </div>

        {/* Center: SOAP editor */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* Vitals */}
          <Card className="p-6">
            <h3 className="font-display text-lg text-ink-800 mb-4">Sinais vitais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <VitalInput icon={<Heart className="size-4 text-flame-500" />} label="PA (mmHg)" value={note.pa} onChange={v => setNote({...note, pa: v})} placeholder="120/80" />
              <VitalInput icon={<Activity className="size-4 text-brand-500" />} label="FC (bpm)" value={note.fc} onChange={v => setNote({...note, fc: v})} placeholder="72" />
              <VitalInput icon={<Activity className="size-4 text-aqua-500" />} label="FR (irpm)" value={note.fr} onChange={v => setNote({...note, fr: v})} placeholder="16" />
              <VitalInput icon={<Thermometer className="size-4 text-honey-500" />} label="Temp (°C)" value={note.temp} onChange={v => setNote({...note, temp: v})} placeholder="36.5" />
              <VitalInput icon={<Activity className="size-4 text-grass-500" />} label="SpO₂ (%)" value={note.spo2} onChange={v => setNote({...note, spo2: v})} placeholder="98" />
              <VitalInput icon={<></>} label="Peso (kg)" value={note.peso} onChange={v => setNote({...note, peso: v})} placeholder="70" />
              <VitalInput icon={<></>} label="Altura (m)" value={note.altura} onChange={v => setNote({...note, altura: v})} placeholder="1.70" />
              <VitalInput icon={<></>} label="IMC" value={note.peso && note.altura ? (parseFloat(note.peso)/Math.pow(parseFloat(note.altura),2)).toFixed(1) : ''} onChange={() => {}} placeholder="auto" readonly />
            </div>
          </Card>

          {/* Anamnese */}
          <Card className="p-6">
            <h3 className="font-display text-lg text-ink-800 mb-4">Anamnese</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Queixa principal"><textarea value={note.queixa} onChange={e => setNote({...note, queixa: e.target.value})} className={textareaCls} rows={3} placeholder="Motivo principal da consulta" /></Field>
              <Field label="HDA — História da doença atual"><textarea value={note.hda} onChange={e => setNote({...note, hda: e.target.value})} className={textareaCls} rows={3} placeholder="Evolução dos sintomas" /></Field>
              <Field label="Antecedentes"><textarea value={note.antecedentes} onChange={e => setNote({...note, antecedentes: e.target.value})} className={textareaCls} rows={2} placeholder="HAS, DM, cirurgias..." /></Field>
              <Field label="Hábitos"><textarea value={note.habitos} onChange={e => setNote({...note, habitos: e.target.value})} className={textareaCls} rows={2} placeholder="Tabagismo, etilismo, atividade física" /></Field>
              <Field label="Medicações em uso"><textarea value={note.medicamentos} onChange={e => setNote({...note, medicamentos: e.target.value})} className={textareaCls} rows={2} /></Field>
              <Field label="Alergias"><textarea value={note.alergias} onChange={e => setNote({...note, alergias: e.target.value})} className={textareaCls} rows={2} /></Field>
            </div>
          </Card>

          {/* SOAP */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-ink-800">Registro SOAP</h3>
              <Badge tone="brand">Modelo · Cardiologia</Badge>
            </div>
            <div className="space-y-5">
              <SoapSection letter="S" label="Subjetivo" value={note.subjetivo} onChange={v => setNote({...note, subjetivo: v})} placeholder="Relato do paciente, sintomas, história..." />
              <SoapSection letter="O" label="Objetivo" value={note.objetivo} onChange={v => setNote({...note, objetivo: v})} placeholder="Exame físico, achados mensuráveis..." />
              <SoapSection letter="A" label="Avaliação" value={note.avaliacao} onChange={v => setNote({...note, avaliacao: v})} placeholder="Análise clínica, impressão diagnóstica..." />
              <SoapSection letter="P" label="Plano" value={note.plano} onChange={v => setNote({...note, plano: v})} placeholder="Conduta, tratamento, retorno..." />
            </div>
          </Card>

          {/* Diagnóstico e conduta */}
          <Card className="p-6">
            <h3 className="font-display text-lg text-ink-800 mb-4">Diagnóstico e conduta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Hipótese diagnóstica"><input value={note.hipotese} onChange={e => setNote({...note, hipotese: e.target.value})} className={inputCls} /></Field>
              <Field label="Diagnóstico (CID-10)"><input value={note.diagnostico} onChange={e => setNote({...note, diagnostico: e.target.value})} className={inputCls} placeholder="Ex: I20.9" /></Field>
              <Field label="Conduta e orientações"><textarea value={note.conduta} onChange={e => setNote({...note, conduta: e.target.value})} className={textareaCls} rows={3} /></Field>
              <Field label="Retorno"><input type="date" value={note.retorno} onChange={e => setNote({...note, retorno: e.target.value})} className={inputCls} /></Field>
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-6">
            <h3 className="font-display text-lg text-ink-800 mb-4">Ações do atendimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button className="p-4 rounded-xl border border-ink-100 hover:border-brand-400 hover:bg-brand-50/50 text-left group" onClick={() => navigate('/prescricoes')}>
                <Pill className="size-5 text-brand-500 mb-2" />
                <div className="font-semibold text-ink-800">Emitir prescrição</div>
                <div className="text-xs text-ink-500">Receita simples, especial ou antimicrobiano</div>
              </button>
              <button className="p-4 rounded-xl border border-ink-100 hover:border-brand-400 hover:bg-brand-50/50 text-left" onClick={() => navigate('/exames')}>
                <Microscope className="size-5 text-aqua-500 mb-2" />
                <div className="font-semibold text-ink-800">Solicitar exames</div>
                <div className="text-xs text-ink-500">Laboratoriais, imagem, cardiológicos</div>
              </button>
              <button className="p-4 rounded-xl border border-ink-100 hover:border-brand-400 hover:bg-brand-50/50 text-left">
                <Printer className="size-5 text-ink-600 mb-2" />
                <div className="font-semibold text-ink-800">Atestado médico</div>
                <div className="text-xs text-ink-500">Comparecimento, afastamento, declaração</div>
              </button>
            </div>
          </Card>

          {/* Finalize */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-ink-800 text-white">
            <div>
              <div className="text-sm font-semibold">Finalizar atendimento</div>
              <div className="text-xs text-ink-300">Assinar bloqueia edições futuras. Adendos continuam audítaveis.</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={<Save className="size-4" />} onClick={() => save(false)}>Salvar rascunho</Button>
              <Button variant="success" size="sm" icon={<Shield className="size-4" />} onClick={() => save(true)}>Assinar e encerrar</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalInput({ icon, label, value, onChange, placeholder, readonly }:{
  icon: React.ReactNode; label: string; value: string; onChange: (v:string)=>void; placeholder?: string; readonly?: boolean
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-ink-500 mb-1 flex items-center gap-1">{icon}{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} readOnly={readonly}
        className={cls(inputCls, 'font-mono', readonly && 'bg-ink-50 text-ink-500')} />
    </div>
  );
}

function SoapSection({ letter, label, value, onChange, placeholder }:{ letter: string; label: string; value: string; onChange:(v:string)=>void; placeholder?: string }) {
  return (
    <div className="flex gap-4">
      <div className="size-10 shrink-0 rounded-xl bg-brand-500 text-white grid place-items-center font-display text-lg shadow-sm">{letter}</div>
      <div className="flex-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 block mb-1.5">{label}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={textareaCls} rows={3} />
      </div>
    </div>
  );
}
