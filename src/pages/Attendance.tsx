import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointments as appointmentsAPI, patients as patientsAPI, soap as soapAPI, auth } from '../lib/api';
import type { AppointmentResponse, PatientResponse, SOAPDraft, SOAPResponse } from '../lib/api';
import { Card, PageHeader, Button, Badge, Field, inputCls, textareaCls } from '../components/ui';
import { STATUS_META } from '../lib/statuses';
import { fmtDate, fmtTimestampDateTime, age, cls } from '../lib/utils';
import {
  Play, Pause, Save, AlertTriangle,
  Pill, Microscope, Heart, Thermometer, Activity, Printer, Stethoscope
} from 'lucide-react';

const emptyDraft: SOAPDraft = {
  queixa:'', hda:'', antecedentes:'', medicamentos:'', alergias:'', habitos:'',
  pa:'', fc:'', fr:'', temp:'', spo2:'', peso:'', altura:'',
  subjetivo:'', objetivo:'', avaliacao:'', plano:'',
  hipotese:'', diagnostico:'', conduta:'', retorno:''
};

function draftFromNote(note: SOAPResponse): SOAPDraft {
  return {
    queixa: note.queixa, hda: note.hda ?? '', antecedentes: note.antecedentes ?? '',
    medicamentos: note.medicamentos ?? '', alergias: note.alergias ?? '', habitos: note.habitos ?? '',
    pa: note.pa ?? '', fc: note.fc ?? '', fr: note.fr ?? '', temp: note.temp ?? '',
    spo2: note.spo2 ?? '', peso: note.peso ?? '', altura: note.altura ?? '',
    subjetivo: note.subjetivo, objetivo: note.objetivo, avaliacao: note.avaliacao, plano: note.plano,
    hipotese: note.hipotese ?? '', diagnostico: note.diagnostico ?? '',
    conduta: note.conduta ?? '', retorno: note.retorno ?? '',
  };
}

interface AttendanceData {
  appointment: AppointmentResponse;
  patient: PatientResponse;
  professional: { id: string; name: string };
  history: SOAPResponse[];
  draft: SOAPResponse | null;
  userId: string;
  userName: string;
  role: string;
}

export default function Attendance() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState<SOAPDraft>(emptyDraft);
  const [savedNote, setSavedNote] = useState<SOAPDraft>(emptyDraft);
  const dirty = JSON.stringify(note) !== JSON.stringify(savedNote);

  useEffect(() => {
    if (!appointmentId) return;
    let active = true;
    appointmentsAPI.getById(appointmentId).then(async appointment => {
      const [patient, professionals, history, draft, user] = await Promise.all([
        patientsAPI.getById(appointment.patient_id), appointmentsAPI.listProfessionals(),
        soapAPI.listByPatient(appointment.patient_id), soapAPI.getByAppointment(appointmentId), auth.profile(),
      ]);
      const professional = professionals.find(p => p.id === appointment.professional_id);
      if (!professional) throw new Error('Profissional do agendamento não encontrado.');
      if (!active) return;
      setData({ appointment, patient, professional, history, draft, userId: user.id, userName: user.name, role: user.role });
      const initialNote = draft ? draftFromNote(draft) : {
        ...emptyDraft,
        alergias: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : '',
        medicamentos: Array.isArray(patient.medications) ? patient.medications.join(', ') : '',
      };
      setNote(initialNote);
      setSavedNote(initialNote);
    }).catch((err: unknown) => {
      if (!active) return;
      console.error('Erro ao carregar atendimento:', err);
      setLoadError({ id: appointmentId, message: err instanceof Error ? err.message : 'Erro ao carregar atendimento.' });
    });
    return () => { active = false; };
  }, [appointmentId]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds(s => s+1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function fmtTime(s: number) {
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s%60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  async function start() {
    if (!data) return;
    setBusy(true);
    setError('');
    try {
      const updated = await appointmentsAPI.start(data.appointment.id);
      setData({ ...data, appointment: updated });
      setRunning(true);
    } catch (err: unknown) {
      console.error('Erro ao iniciar atendimento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao iniciar atendimento.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!data) return;
    if (data.draft && !data.draft.version) {
      setError('Não foi possível verificar a versão da nota. Recarregue o atendimento.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const saved = await soapAPI.saveAppointmentDraft(data.appointment.id, note, data.draft?.version ?? null);
      setData({ ...data, draft: saved, appointment: { ...data.appointment, status: 'em_atendimento' } });
      setSavedNote(note);
      setMessage('Rascunho salvo no prontuário.');
    } catch (err: unknown) {
      console.error('Erro ao salvar rascunho:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar rascunho.');
    } finally {
      setBusy(false);
    }
  }

  function goTo(path: string) {
    if (dirty) {
      setError('Salve o rascunho antes de sair do atendimento.');
      return;
    }
    navigate(path);
  }

  if (!appointmentId || loadError?.id === appointmentId) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Card className="p-12 text-center">
          <Stethoscope className="size-10 mx-auto text-ink-300 mb-3" />
          <h2 className="font-display text-xl text-ink-800">{appointmentId ? 'Não foi possível carregar o atendimento' : 'Selecione um agendamento'}</h2>
          <p className="text-sm text-ink-500 mt-1 mb-4">{appointmentId ? loadError?.message : 'Abra um agendamento na agenda para iniciar o atendimento.'}</p>
          <Button onClick={() => navigate('/agenda')}>Ir para agenda</Button>
        </Card>
      </div>
    );
  }

  if (!data || data.appointment.id !== appointmentId) return <div className="p-8">Carregando atendimento...</div>;
  const { appointment: activeAppt, patient, professional, history, draft, userId, userName, role } = data;
  const patientHistory = history.filter(n => n.id !== draft?.id);
  const canEdit = ['medico', 'admin', 'superadmin'].includes(role) &&
    ['agendado', 'confirmado', 'aguardando', 'em_atendimento'].includes(activeAppt.status) &&
    (!draft || (!draft.signed && draft.professional_id === userId));
  if (!canEdit) return (
    <div className="p-8 max-w-3xl mx-auto">
      <Card className="p-8">
        <h2 className="font-display text-xl">Atendimento indisponível para edição</h2>
        <p className="text-sm mt-2">
          {!['medico', 'admin', 'superadmin'].includes(role)
            ? 'A conta autenticada não possui permissão para registrar um atendimento. Entre com uma conta autorizada.'
            : !['agendado', 'confirmado', 'aguardando', 'em_atendimento'].includes(activeAppt.status)
              ? `O agendamento está com status ${STATUS_META[activeAppt.status as keyof typeof STATUS_META]?.label ?? activeAppt.status} e não permite edição.`
              : draft?.signed
                ? 'A nota vinculada está assinada e não pode ser alterada.'
                : 'O rascunho vinculado pertence a outro profissional e não pode ser alterado por esta conta.'}
        </p>
        <Button className="mt-4" onClick={() => navigate(`/prontuarios?patientId=${encodeURIComponent(patient.id)}`)}>Ver prontuário</Button>
      </Card>
    </div>
  );
  const st = STATUS_META[activeAppt.status as keyof typeof STATUS_META];
  const weight = Number(note.peso);
  const height = Number(note.altura);
  const bmi = Number.isFinite(weight) && Number.isFinite(height) && weight > 0 && height > 0
    ? (weight / (height * height)).toFixed(1) : '';

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Prontuário eletrônico · Atendimento" title={`Consulta — ${patient.name}`} subtitle={`Profissional agendado: ${professional.name} · Usuário autenticado: ${userName}`} />

      {error && <Card className="p-4 mb-4 text-flame-600" >{error}</Card>}
      {message && !dirty && <Card className="p-4 mb-4 text-grass-600">{message}</Card>}

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
        <div className="flex-1 text-sm text-brand-100">Início: {activeAppt.start_time.slice(0, 5)} · Previsão: {activeAppt.end_time.slice(0, 5)}</div>
        {!running ? (
          <Button variant="success" size="sm" disabled={busy} icon={<Play className="size-4" />} onClick={start}>Iniciar</Button>
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
            <div className="text-xs text-ink-500">{patient.birth ? `${fmtDate(patient.birth.slice(0, 10))} · ${age(patient.birth)} anos · ` : 'Nascimento não informado · '}{patient.sex === 'F' ? 'Feminino' : patient.sex === 'M' ? 'Masculino' : patient.sex === 'O' ? 'Outro' : 'Sexo não informado'}</div>
            <div className="text-xs text-ink-500 font-mono mt-1">{patient.code}</div>
            <div className="mt-3 space-y-1 text-xs text-ink-600">
              <div><strong>CPF:</strong> {patient.cpf}</div>
              <div><strong>Telefone:</strong> {patient.phone || 'Não informado'}</div>
              <div><strong>E-mail:</strong> {patient.email || 'Não informado'}</div>
              <div><strong>Convênio:</strong> {patient.insurance || 'Não informado'}</div>
              <div><strong>Profissional:</strong> {professional.name}</div>
              <div><strong>Especialidade:</strong> {activeAppt.specialty || 'Não informada'}</div>
              <div><strong>Data:</strong> {fmtDate(activeAppt.date.slice(0, 10))} · {activeAppt.start_time.slice(0, 5)}</div>
              <div><strong>Tipo:</strong> {activeAppt.type}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-ink-100 space-y-2">
              <div className="flex items-start gap-2"><AlertTriangle className="size-4 text-flame-500 mt-0.5" /><div><div className="text-[11px] uppercase tracking-wider text-flame-600 font-semibold">Alergias</div><div className="text-xs text-ink-700">{patient.allergies?.length ? patient.allergies.join(', ') : 'Não informadas'}</div></div></div>
              <div className="flex items-start gap-2"><Pill className="size-4 text-brand-500 mt-0.5" /><div><div className="text-[11px] uppercase tracking-wider text-brand-600 font-semibold">Medicações registradas</div><div className="text-xs text-ink-700">{patient.medications?.length ? patient.medications.join(', ') : 'Não informadas'}</div></div></div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-2">Histórico</div>
            {patientHistory.length === 0 && <div className="text-xs text-ink-500">Nenhuma nota anterior encontrada.</div>}
            {patientHistory.map(h => (
              <details key={h.id} className="py-2 border-t border-ink-100 first:border-0 first:pt-0">
                <summary className="cursor-pointer text-sm text-ink-800">
                  {fmtTimestampDateTime(h.created_at)} · {h.professional_name || 'Profissional não informado'} · {h.signed ? 'Assinatura registrada no sistema' : 'Rascunho'}
                </summary>
                <div className="mt-2 space-y-2 text-xs">
                  {([
                    ['Queixa principal', h.queixa], ['História da doença atual', h.hda],
                    ['Antecedentes', h.antecedentes], ['Medicações', h.medicamentos],
                    ['Alergias', h.alergias], ['Hábitos', h.habitos],
                    ['Pressão arterial', h.pa], ['Frequência cardíaca', h.fc],
                    ['Frequência respiratória', h.fr], ['Temperatura', h.temp],
                    ['Saturação', h.spo2], ['Peso', h.peso], ['Altura', h.altura],
                    ['Subjetivo', h.subjetivo], ['Objetivo', h.objetivo],
                    ['Avaliação', h.avaliacao], ['Plano', h.plano],
                    ['Hipótese diagnóstica', h.hipotese], ['Diagnóstico', h.diagnostico],
                    ['Conduta', h.conduta], ['Retorno', h.retorno],
                  ] as const).map(([label, value]) => value && (
                    <div key={label}><strong>{label}:</strong> <span className="whitespace-pre-wrap">{value}</span></div>
                  ))}
                </div>
              </details>
            ))}
          </Card>
        </div>

        {/* Center: SOAP editor */}
        <fieldset disabled={busy} className="col-span-12 lg:col-span-9 space-y-6">
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
              <VitalInput icon={<></>} label="IMC" value={bmi} onChange={() => {}} placeholder="auto" readonly />
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
              <Badge tone="brand">Rascunho</Badge>
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
              <button className="p-4 rounded-xl border border-ink-100 hover:border-brand-400 hover:bg-brand-50/50 text-left group" onClick={() => goTo('/prescricoes')}>
                <Pill className="size-5 text-brand-500 mb-2" />
                <div className="font-semibold text-ink-800">Emitir prescrição</div>
                <div className="text-xs text-ink-500">Receita simples, especial ou antimicrobiano</div>
              </button>
              <button className="p-4 rounded-xl border border-ink-100 hover:border-brand-400 hover:bg-brand-50/50 text-left" onClick={() => goTo('/exames')}>
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
              <div className="text-sm font-semibold">Salvar atendimento</div>
              <div className="text-xs text-ink-300">Apenas rascunhos estão disponíveis. Assinatura certificada ainda não foi implementada.</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={<Save className="size-4" />} onClick={save}>Salvar rascunho</Button>
              <Button variant="secondary" size="sm" onClick={() => goTo(`/prontuarios?patientId=${encodeURIComponent(patient.id)}`)}>Ver prontuário</Button>
            </div>
          </div>
        </fieldset>
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
