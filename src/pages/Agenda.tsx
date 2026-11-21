import { useMemo, useState } from 'react';
import { useStore, actions } from '../lib/store';
import { Card, PageHeader, Button, Modal, Field, inputCls, textareaCls, selectCls, Badge } from '../components/ui';
import { STATUS_META } from '../lib/statuses';
import { addDays, cls, fmtDateLong, todayISO } from '../lib/utils';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, CalendarDays, CalendarRange,
  List, Clock, Ban, UserPlus, Phone, MessageSquare, Video, Filter
} from 'lucide-react';
import type { AppointmentStatus, Appointment } from '../lib/types';
import { useNavigate } from 'react-router-dom';

type View = 'dia'|'semana'|'mes';

const HOURS = Array.from({length: 11}, (_, i) => 8 + i); // 8 - 18

export default function Agenda() {
  const navigate = useNavigate();
  const appointments = useStore(s => s.appointments);
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const waitlist = useStore(s => s.waitlist);
  const units = useStore(s => s.units);
  const activeUnitId = useStore(s => s.activeUnitId);

  const [date, setDate] = useState(todayISO());
  const [view, setView] = useState<View>('dia');
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [newOpen, setNewOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<{ date: string; start: string } | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [waitOpen, setWaitOpen] = useState(false);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (professionalFilter !== 'all' && a.professionalId !== professionalFilter) return false;
      if (a.unitId !== activeUnitId) return false;
      return true;
    });
  }, [appointments, professionalFilter, activeUnitId]);

  const dayAppts = useMemo(() => filtered.filter(a => a.date === date).sort((a,b) => a.start.localeCompare(b.start)), [filtered, date]);

  function openNew(d: string, start: string) {
    setNewSlot({ date: d, start });
    setNewOpen(true);
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Agenda médica" title="Agenda inteligente" subtitle="Gerencie consultas, retornos, procedimentos e teleconsultas com visualização diária, semanal e mensal.">
        <Button variant="secondary" size="sm" icon={<List className="size-4" />} onClick={() => setWaitOpen(true)}>
          Lista de espera <Badge tone="honey" className="ml-1">{waitlist.length}</Badge>
        </Button>
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => openNew(date, '09:00')}>Novo agendamento</Button>
      </PageHeader>

      {/* Toolbar */}
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-ink-50 rounded-lg p-1">
          <button onClick={() => setDate(addDays(date, view==='dia'?-1:view==='semana'?-7:-30))} className="size-8 grid place-items-center rounded-md hover:bg-white text-ink-500">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setDate(todayISO())} className="px-3 h-8 text-xs font-medium text-ink-700 hover:bg-white rounded-md">Hoje</button>
          <button onClick={() => setDate(addDays(date, view==='dia'?1:view==='semana'?7:30))} className="size-8 grid place-items-center rounded-md hover:bg-white text-ink-500">
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex-1 min-w-48">
          <div className="text-sm font-semibold text-ink-800 capitalize">{fmtDateLong(date)}</div>
          <div className="text-xs text-ink-500">{dayAppts.length} agendamentos · {units.find(u => u.id === activeUnitId)?.name}</div>
        </div>

        <div className="flex items-center gap-1 bg-ink-50 rounded-lg p-1">
          {([
            ['dia', CalIcon, 'Dia'],
            ['semana', CalendarDays, 'Semana'],
            ['mes', CalendarRange, 'Mês'],
          ] as const).map(([v, Icon, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={cls('flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium',
                view === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-800')}>
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>

        <select value={professionalFilter} onChange={e => setProfessionalFilter(e.target.value)}
          className={cls(selectCls, 'w-auto min-w-48 h-9')}>
          <option value="all">Todos os profissionais</option>
          {professionals.map(p => <option key={p.id} value={p.id}>{p.name} · {p.specialty}</option>)}
        </select>

        <Button variant="secondary" size="sm" icon={<Filter className="size-4" />}>Mais filtros</Button>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-9">
          {view === 'dia' && <DayView date={date} appointments={dayAppts} onNew={openNew} onSelect={setSelected} />}
          {view === 'semana' && <WeekView date={date} appointments={filtered} onNew={openNew} onSelect={setSelected} />}
          {view === 'mes' && <MonthView date={date} appointments={filtered} onSelectDay={(d) => { setDate(d); setView('dia'); }} />}
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-4">
          {/* Status legend */}
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-3">Status</div>
            <div className="space-y-2">
              {(Object.keys(STATUS_META) as AppointmentStatus[]).map(s => {
                const m = STATUS_META[s];
                const count = filtered.filter(a => a.date === date && a.status === s).length;
                return (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-ink-700">
                      <span className={cls('size-2 rounded-full', m.dot)} /> {m.label}
                    </span>
                    <span className="text-ink-500 font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Mini-calendar */}
          <MiniCalendar selected={date} onSelect={setDate} />

          {/* Communication */}
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">Comunicação</div>
            <h4 className="font-display text-base text-ink-800 mb-3">Confirmações automáticas</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50">
                <MessageSquare className="size-4 text-grass-600" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-ink-800">WhatsApp</div>
                  <div className="text-ink-500">8 enviadas hoje</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-50">
                <Phone className="size-4 text-brand-600" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-ink-800">SMS</div>
                  <div className="text-ink-500">4 enviados hoje</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* New appointment */}
      <NewAppointmentModal
        open={newOpen}
        onClose={() => { setNewOpen(false); setNewSlot(null); }}
        initialSlot={newSlot}
      />

      {/* Detail */}
      <AppointmentDetailModal
        appt={selected}
        onClose={() => setSelected(null)}
        onStart={() => selected && navigate(`/atendimento/${selected.id}`)}
      />

      {/* Waitlist */}
      <WaitlistModal open={waitOpen} onClose={() => setWaitOpen(false)} />
    </div>
  );
}

function DayView({ date, appointments, onNew, onSelect }:{
  date: string; appointments: Appointment[]; onNew: (d:string,h:string)=>void; onSelect:(a:Appointment)=>void;
}) {
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const now = new Date();
  const isToday = date === todayISO();
  const nowTop = (now.getHours() - 8) * 72 + (now.getMinutes()/60)*72;

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[72px_1fr] max-h-[70vh] overflow-y-auto relative">
        <div className="border-r border-ink-100 bg-ink-50/50">
          {HOURS.map(h => (
            <div key={h} className="h-[72px] px-3 pt-1 text-[11px] text-ink-400 font-mono">
              {h.toString().padStart(2,'0')}:00
            </div>
          ))}
        </div>
        <div className="relative">
          {HOURS.map(h => (
            <div key={h} className="h-[72px] border-b border-ink-100 relative group">
              <button onClick={() => onNew(date, `${h.toString().padStart(2,'0')}:00`)}
                className="absolute inset-0 w-full h-full hover:bg-brand-50/40 transition" />
              <button onClick={() => onNew(date, `${h.toString().padStart(2,'0')}:30`)}
                className="absolute left-0 right-0 top-1/2 h-1/2 hover:bg-brand-50/40 border-t border-dashed border-ink-100 transition" />
            </div>
          ))}
          {isToday && nowTop >= 0 && nowTop <= HOURS.length*72 && (
            <div className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: nowTop }}>
              <div className="relative">
                <div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-flame-500" />
                <div className="h-px bg-flame-500" />
              </div>
            </div>
          )}
          {appointments.map(a => {
            const p = patients.find(x => x.id === a.patientId);
            const pr = professionals.find(x => x.id === a.professionalId);
            const [sh, sm] = a.start.split(':').map(Number);
            const [eh, em] = a.end.split(':').map(Number);
            const top = (sh - 8)*72 + (sm/60)*72;
            const height = ((eh*60+em)-(sh*60+sm))/60 * 72 - 4;
            const st = STATUS_META[a.status];
            return (
              <button key={a.id} onClick={() => onSelect(a)}
                className={cls('absolute left-2 right-3 rounded-lg px-3 py-2 text-left overflow-hidden ring-1 hover:shadow-md transition', st.bg, st.ring)}
                style={{ top, height, borderLeft: `4px solid ${pr?.color}` }}>
                <div className="flex items-center gap-2">
                  <span className={cls('size-1.5 rounded-full', st.dot)} />
                  <div className="text-[11px] font-mono text-ink-600">{a.start}–{a.end}</div>
                  {a.type === 'teleconsulta' && <Video className="size-3 text-brand-500" />}
                </div>
                <div className="text-sm font-semibold text-ink-800 truncate mt-0.5">{p?.name}</div>
                <div className="text-[11px] text-ink-500 truncate">{a.procedure} · {pr?.specialty}</div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function WeekView({ date, appointments, onNew, onSelect }:{
  date: string; appointments: Appointment[]; onNew:(d:string,h:string)=>void; onSelect:(a:Appointment)=>void;
}) {
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const d = new Date(date+'T00:00:00');
  const start = new Date(d); start.setDate(d.getDate() - d.getDay());
  const days = Array.from({length:7}, (_,i) => {
    const dt = new Date(start); dt.setDate(start.getDate()+i);
    const iso = `${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}`;
    return { iso, dt };
  });

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-ink-100">
        <div />
        {days.map(({iso,dt}) => (
          <div key={iso} className={cls('px-2 py-3 text-center border-l border-ink-100', iso === todayISO() && 'bg-brand-50')}>
            <div className="text-[11px] uppercase text-ink-400">{dt.toLocaleDateString('pt-BR',{weekday:'short'}).slice(0,3)}</div>
            <div className={cls('text-lg font-display mt-0.5', iso === todayISO() ? 'text-brand-700' : 'text-ink-800')}>{dt.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[65vh] overflow-y-auto relative">
        <div className="bg-ink-50/50">
          {HOURS.map(h => <div key={h} className="h-14 px-2 pt-0.5 text-[10px] text-ink-400 font-mono">{h.toString().padStart(2,'0')}:00</div>)}
        </div>
        {days.map(({iso}) => (
          <div key={iso} className="relative border-l border-ink-100">
            {HOURS.map(h => (
              <div key={h} className="h-14 border-b border-ink-100">
                <button onClick={() => onNew(iso, `${h.toString().padStart(2,'0')}:00`)} className="w-full h-full hover:bg-brand-50/40" />
              </div>
            ))}
            {appointments.filter(a => a.date === iso).map(a => {
              const p = patients.find(x => x.id === a.patientId);
              const pr = professionals.find(x => x.id === a.professionalId);
              const [sh, sm] = a.start.split(':').map(Number);
              const [eh, em] = a.end.split(':').map(Number);
              const top = (sh - 8)*56 + (sm/60)*56;
              const height = Math.max(((eh*60+em)-(sh*60+sm))/60 * 56 - 2, 24);
              const st = STATUS_META[a.status];
              return (
                <button key={a.id} onClick={() => onSelect(a)}
                  className={cls('absolute left-1 right-1 rounded px-1.5 py-1 text-left overflow-hidden ring-1 hover:shadow-md transition', st.bg, st.ring)}
                  style={{top, height, borderLeft: `3px solid ${pr?.color}`}}>
                  <div className="text-[9px] font-mono text-ink-600">{a.start}</div>
                  <div className="text-[10px] font-semibold text-ink-800 truncate leading-tight">{p?.name.split(' ').slice(0,2).join(' ')}</div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

function MonthView({ date, appointments, onSelectDay }:{
  date: string; appointments: Appointment[]; onSelectDay:(d:string)=>void;
}) {
  const d = new Date(date+'T00:00:00');
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const cells = Array.from({length: 42}, (_,i) => {
    const dt = new Date(start); dt.setDate(start.getDate()+i);
    const iso = `${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}`;
    return { iso, dt, inMonth: dt.getMonth() === d.getMonth() };
  });
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-ink-100">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(w => (
          <div key={w} className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-ink-400 font-semibold text-center">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map(({iso, dt, inMonth}, i) => {
          const count = appointments.filter(a => a.date === iso).length;
          const isToday = iso === todayISO();
          return (
            <button key={i} onClick={() => onSelectDay(iso)}
              className={cls('aspect-square border-r border-b border-ink-100 p-2 hover:bg-brand-50/40 text-left',
                !inMonth && 'bg-ink-50/40 text-ink-300',
                isToday && 'bg-brand-50')}>
              <div className="flex items-center justify-between">
                <span className={cls('text-sm font-semibold', isToday && 'text-brand-700')}>{dt.getDate()}</span>
                {count > 0 && <Badge tone={isToday?'brand':'ink'}>{count}</Badge>}
              </div>
              <div className="mt-1 space-y-0.5">
                {appointments.filter(a => a.date === iso).slice(0,2).map(a => (
                  <div key={a.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-ink-700 truncate">
                    {a.start} · {a.procedure?.slice(0,14)}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function MiniCalendar({ selected, onSelect }:{ selected: string; onSelect:(d:string)=>void }) {
  const d = new Date(selected+'T00:00:00');
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const cells = Array.from({length: 42}, (_,i) => {
    const dt = new Date(start); dt.setDate(start.getDate()+i);
    const iso = `${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}`;
    return { iso, dt, inMonth: dt.getMonth() === d.getMonth() };
  });
  return (
    <Card className="p-5">
      <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-3">
        {d.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })}
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-ink-400 mb-1">
        {['D','S','T','Q','Q','S','S'].map((w,i) => <div key={i}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({iso, dt, inMonth}, i) => (
          <button key={i} onClick={() => onSelect(iso)}
            className={cls('aspect-square text-xs rounded-md',
              !inMonth && 'text-ink-300',
              inMonth && 'text-ink-700 hover:bg-brand-50',
              iso === selected && 'bg-brand-500 text-white hover:bg-brand-600',
              iso === todayISO() && iso !== selected && 'ring-1 ring-brand-400 text-brand-700 font-semibold')}>
            {dt.getDate()}
          </button>
        ))}
      </div>
    </Card>
  );
}

function NewAppointmentModal({ open, onClose, initialSlot }:{
  open: boolean; onClose: () => void; initialSlot: { date: string; start: string } | null;
}) {
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const units = useStore(s => s.units);
  const activeUnitId = useStore(s => s.activeUnitId);
  const appointments = useStore(s => s.appointments);

  const [patientId, setPatientId] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [professionalId, setProfessionalId] = useState('p1');
  const [unitId, setUnitId] = useState(activeUnitId);
  const [date, setDate] = useState(initialSlot?.date || todayISO());
  const [start, setStart] = useState(initialSlot?.start || '09:00');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<Appointment['type']>('consulta');
  const [insurance, setInsurance] = useState('Particular');
  const [procedure, setProcedure] = useState('Consulta eletiva');
  const [value, setValue] = useState(380);
  const [payment, setPayment] = useState<Appointment['payment']>('particular');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const patientResults = patientQuery.length >= 2
    ? patients.filter(p => p.name.toLowerCase().includes(patientQuery.toLowerCase())).slice(0,5)
    : [];

  function save() {
    setError('');
    if (!patientId) { setError('Selecione um paciente'); return; }
    const [sh, sm] = start.split(':').map(Number);
    const endMin = sh*60 + sm + duration;
    const end = `${Math.floor(endMin/60).toString().padStart(2,'0')}:${(endMin%60).toString().padStart(2,'0')}`;
    // conflict check
    const conflict = appointments.find(a =>
      a.date === date && a.professionalId === professionalId && a.status !== 'cancelado' &&
      (start < a.end && end > a.start)
    );
    if (conflict) { setError('Conflito de horário com outro agendamento deste profissional.'); return; }
    actions.addAppointment({
      patientId, professionalId, unitId, date, start, end, type, insurance, procedure, value, payment,
      status:'agendado', notes
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" size="xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Paciente">
            <div className="relative">
              <input value={patientQuery || (patients.find(p => p.id === patientId)?.name ?? '')} onChange={e => { setPatientQuery(e.target.value); setPatientId(''); }}
                placeholder="Buscar por nome, CPF ou código" className={inputCls} />
              {patientResults.length > 0 && !patientId && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg ring-1 ring-ink-100 z-10 max-h-56 overflow-auto">
                  {patientResults.map(p => (
                    <button key={p.id} onClick={() => { setPatientId(p.id); setPatientQuery(p.name); }}
                      className="w-full text-left px-3 py-2 hover:bg-ink-50 text-sm flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className="text-xs text-ink-400 font-mono">{p.code}</span>
                    </button>
                  ))}
                </div>
              )}
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-600 text-xs flex items-center gap-1 px-2 h-7 rounded hover:bg-brand-50">
                <UserPlus className="size-3.5" /> Novo
              </button>
            </div>
          </Field>
        </div>

        <Field label="Profissional"><select value={professionalId} onChange={e => setProfessionalId(e.target.value)} className={selectCls}>
          {professionals.map(p => <option key={p.id} value={p.id}>{p.name} · {p.specialty}</option>)}
        </select></Field>

        <Field label="Unidade"><select value={unitId} onChange={e => setUnitId(e.target.value)} className={selectCls}>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select></Field>

        <Field label="Data"><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} /></Field>
        <Field label="Horário início"><input type="time" value={start} onChange={e => setStart(e.target.value)} className={inputCls} /></Field>

        <Field label="Duração (min)"><input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value)||30)} className={inputCls} /></Field>
        <Field label="Tipo"><select value={type} onChange={e => setType(e.target.value as Appointment['type'])} className={selectCls}>
          <option value="consulta">Consulta</option>
          <option value="retorno">Retorno</option>
          <option value="procedimento">Procedimento</option>
          <option value="teleconsulta">Teleconsulta</option>
          <option value="exame">Exame</option>
        </select></Field>

        <Field label="Pagamento"><select value={payment} onChange={e => setPayment(e.target.value as Appointment['payment'])} className={selectCls}>
          <option value="particular">Particular</option>
          <option value="convenio">Convênio</option>
          <option value="cortesia">Cortesia</option>
        </select></Field>

        <Field label="Convênio / Operadora"><input value={insurance} onChange={e => setInsurance(e.target.value)} className={inputCls} /></Field>

        <Field label="Procedimento"><input value={procedure} onChange={e => setProcedure(e.target.value)} className={inputCls} /></Field>
        <Field label="Valor (R$)"><input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value)||0)} className={inputCls} /></Field>

        <div className="col-span-2">
          <Field label="Observações"><textarea value={notes} onChange={e => setNotes(e.target.value)} className={textareaCls} rows={3} /></Field>
        </div>
      </div>
      {error && <div className="mt-3 p-3 bg-rose-50 text-flame-600 text-sm rounded-lg flex items-center gap-2"><Ban className="size-4" /> {error}</div>}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} icon={<Plus className="size-4" />}>Salvar agendamento</Button>
      </div>
    </Modal>
  );
}

function AppointmentDetailModal({ appt, onClose, onStart }:{
  appt: Appointment | null; onClose: ()=>void; onStart: ()=>void;
}) {
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  if (!appt) return null;
  const p = patients.find(x => x.id === appt.patientId);
  const pr = professionals.find(x => x.id === appt.professionalId);
  const st = STATUS_META[appt.status];
  const statuses: AppointmentStatus[] = ['agendado','confirmado','aguardando','em_atendimento','atendido','falta','cancelado'];
  return (
    <Modal open={!!appt} onClose={onClose} title="Detalhes do agendamento" size="lg">
      <div className="flex items-start gap-4 pb-4 border-b border-ink-100">
        <div className="size-14 rounded-full bg-brand-50 text-brand-700 grid place-items-center text-lg font-semibold">
          {p?.name.split(' ').slice(0,2).map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="text-xl font-semibold text-ink-800">{p?.name}</div>
          <div className="text-sm text-ink-500">{p?.code} · {p?.cpf} · {p?.phone}</div>
          <div className="mt-2 flex items-center gap-2">
            <span className={cls('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', st.bg, st.color)}>
              <span className={cls('size-1.5 rounded-full', st.dot)} /> {st.label}
            </span>
            <Badge tone="brand">{appt.insurance}</Badge>
            {appt.type === 'teleconsulta' && <Badge tone="aqua"><Video className="size-3" /> Teleconsulta</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 text-sm">
        <div><div className="text-xs text-ink-400">Profissional</div><div className="text-ink-800 font-medium">{pr?.name}</div><div className="text-xs text-ink-500">{pr?.specialty} · {pr?.crm}</div></div>
        <div><div className="text-xs text-ink-400">Horário</div><div className="text-ink-800 font-medium"><Clock className="size-3.5 inline mr-1 text-ink-400" />{appt.start} – {appt.end}</div></div>
        <div><div className="text-xs text-ink-400">Procedimento</div><div className="text-ink-800">{appt.procedure}</div></div>
        <div><div className="text-xs text-ink-400">Valor</div><div className="text-ink-800 font-semibold">{appt.value ? appt.value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'}</div></div>
        {appt.notes && <div className="col-span-2"><div className="text-xs text-ink-400">Observações</div><div className="text-ink-800">{appt.notes}</div></div>}
      </div>

      <div className="pt-4 border-t border-ink-100">
        <div className="text-xs text-ink-400 mb-2">Alterar status</div>
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => {
            const m = STATUS_META[s];
            return (
              <button key={s} onClick={() => actions.updateAppointment(appt.id, { status: s })}
                className={cls('text-xs px-2.5 py-1 rounded-full', m.bg, m.color,
                  appt.status === s ? 'ring-2 ring-offset-1 ' + m.ring : 'opacity-70 hover:opacity-100')}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
        <Button variant="ghost" icon={<MessageSquare className="size-4" />}>WhatsApp</Button>
        <Button variant="secondary" icon={<Phone className="size-4" />}>Ligar</Button>
        <Button variant="danger" onClick={() => { actions.updateAppointment(appt.id, { status: 'cancelado' }); onClose(); }}>Cancelar</Button>
        <Button onClick={onStart} icon={<Video className="size-4" />}>Iniciar atendimento</Button>
      </div>
    </Modal>
  );
}

function WaitlistModal({ open, onClose }:{ open: boolean; onClose: ()=>void }) {
  const waitlist = useStore(s => s.waitlist);
  const patients = useStore(s => s.patients);
  return (
    <Modal open={open} onClose={onClose} title="Lista de espera" size="lg">
      <div className="space-y-2">
        {waitlist.map(w => {
          const p = patients.find(x => x.id === w.patientId);
          return (
            <div key={w.id} className="flex items-center gap-4 p-4 rounded-xl bg-ink-50 border border-ink-100">
              <div className="size-10 rounded-full bg-brand-50 text-brand-700 grid place-items-center font-semibold text-sm">
                {p?.name.split(' ').slice(0,2).map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-800">{p?.name}</span>
                  <Badge tone={w.priority === 'alta' ? 'flame' : w.priority === 'media' ? 'honey' : 'ink'}>{w.priority.toUpperCase()}</Badge>
                </div>
                <div className="text-xs text-ink-500">{w.specialty} · {w.availability}</div>
                {w.notes && <div className="text-xs text-ink-500 mt-1 italic">“{w.notes}”</div>}
              </div>
              <Button size="sm" variant="secondary">Encaixar</Button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
