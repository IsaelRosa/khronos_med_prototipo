import { useParams, useNavigate } from 'react-router-dom';
import { useStore, actions } from '../lib/store';
import { useState, useMemo } from 'react';
import { Activity, ArrowRight, CheckCircle2, Clock, Stethoscope, User, Calendar as CalIcon, Shield, MapPin } from 'lucide-react';
import { fmtDateLong, todayISO, addDays, cls } from '../lib/utils';
import { specialties } from '../lib/mock';

export default function PublicBooking() {
  const { clinicSlug } = useParams();
  const navigate = useNavigate();
  const clinic = useStore(s => s.clinic);
  const professionals = useStore(s => s.professionals);
  const units = useStore(s => s.units);
  const appointments = useStore(s => s.appointments);

  const [step, setStep] = useState(1);
  const [specialty, setSpecialty] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [date, setDate] = useState(addDays(todayISO(), 1));
  const [slot, setSlot] = useState('');
  const [form, setForm] = useState({ name:'', cpf:'', phone:'', email:'' });

  const availableProfs = useMemo(() => professionals.filter(p => !specialty || p.specialty === specialty), [professionals, specialty]);

  const slots = useMemo(() => {
    const list: string[] = [];
    for (let h=8; h<=17; h++) { for (const m of [0,30]) list.push(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`); }
    return list.filter(s => !appointments.some(a => a.date === date && a.professionalId === professionalId && a.start === s && a.status !== 'cancelado'));
  }, [appointments, date, professionalId]);

  function finish() {
    const patientId = actions.addPatient({
      name: form.name, cpf: form.cpf, phone: form.phone, whatsapp: form.phone, email: form.email,
      birth:'1990-01-01', sex:'O', address:'', emergencyContact:'', allergies:[], medications:[],
      insurance:'Particular'
    });
    const [h,m] = slot.split(':').map(Number);
    const endMin = h*60+m+30;
    const end = `${Math.floor(endMin/60).toString().padStart(2,'0')}:${(endMin%60).toString().padStart(2,'0')}`;
    actions.addAppointment({
      patientId, professionalId, unitId, date, start: slot, end,
      type:'consulta', insurance:'Particular', procedure:'Consulta online',
      value: 380, payment:'particular', status:'agendado'
    });
    setStep(5);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-aqua-50">
      {/* Header */}
      <header className="glass border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-brand-700 grid place-items-center"><Activity className="size-5 text-white" /></div>
          <div><div className="font-display text-lg text-ink-800 leading-none">{clinic.name}</div><div className="text-[11px] text-ink-500 uppercase tracking-widest">Agendamento online · Khronos</div></div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-500"><Shield className="size-3.5" /> Reserva segura</div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Especialidade','Profissional','Horário','Dados','Confirmação'].map((l, i) => {
            const n = i+1;
            return (
              <div key={l} className="flex items-center flex-1 last:flex-none">
                <div className={cls('size-8 rounded-full grid place-items-center text-xs font-semibold',
                  step >= n ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500')}>{step > n ? <CheckCircle2 className="size-4" /> : n}</div>
                <div className="ml-2 text-xs text-ink-700 hidden sm:block">{l}</div>
                {i < 4 && <div className={cls('flex-1 h-0.5 mx-2', step > n ? 'bg-brand-500' : 'bg-ink-100')} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl card-ring p-8">
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl text-ink-800 mb-2">Qual especialidade você precisa?</h2>
              <p className="text-sm text-ink-500 mb-6">Selecione a área para encontrarmos os médicos disponíveis.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specialties.slice(0,9).map(s => (
                  <button key={s} onClick={() => { setSpecialty(s); setStep(2); }}
                    className={cls('p-4 rounded-xl border text-left transition', specialty === s ? 'border-brand-500 bg-brand-50' : 'border-ink-100 hover:border-brand-300')}>
                    <Stethoscope className="size-5 text-brand-500 mb-2" />
                    <div className="text-sm font-medium text-ink-800">{s}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl text-ink-800 mb-2">Escolha o profissional</h2>
              <p className="text-sm text-ink-500 mb-6">{specialty} · Selecione quem você deseja consultar.</p>
              <div className="space-y-2">
                {availableProfs.map(p => (
                  <button key={p.id} onClick={() => { setProfessionalId(p.id); setStep(3); }}
                    className={cls('w-full flex items-center gap-4 p-4 rounded-xl border text-left transition', professionalId === p.id ? 'border-brand-500 bg-brand-50' : 'border-ink-100 hover:border-brand-300')}>
                    <div className="size-12 rounded-full grid place-items-center text-white font-semibold" style={{backgroundColor: p.color}}>{p.name.split(' ').slice(0,2).map(n => n[0]).join('')}</div>
                    <div className="flex-1"><div className="font-semibold text-ink-800">{p.name}</div><div className="text-sm text-ink-500">{p.specialty} · {p.crm}</div></div>
                    <ArrowRight className="size-4 text-ink-400" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-6 text-sm text-ink-500 hover:text-brand-600">← Voltar</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl text-ink-800 mb-2">Escolha o horário</h2>
              <p className="text-sm text-ink-500 mb-6 capitalize">{fmtDateLong(date)}</p>
              <div className="flex items-center gap-2 mb-5">
                <select value={unitId} onChange={e => setUnitId(e.target.value)} className="h-10 px-3 rounded-lg bg-ink-50 border border-ink-100 text-sm flex-1">
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 px-3 rounded-lg bg-ink-50 border border-ink-100 text-sm" />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {slots.map(s => (
                  <button key={s} onClick={() => { setSlot(s); setStep(4); }}
                    className={cls('h-11 rounded-lg border text-sm font-mono', slot === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-ink-100 text-ink-700 hover:border-brand-400')}>{s}</button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="mt-6 text-sm text-ink-500 hover:text-brand-600">← Voltar</button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display text-2xl text-ink-800 mb-2">Seus dados</h2>
              <p className="text-sm text-ink-500 mb-6">Apenas o essencial para confirmarmos sua consulta.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-xs text-ink-600 font-medium">Nome completo</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1 w-full h-11 px-3 rounded-lg border border-ink-100 focus:border-brand-400 outline-none" /></div>
                <div><label className="text-xs text-ink-600 font-medium">CPF</label><input value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="mt-1 w-full h-11 px-3 rounded-lg border border-ink-100 focus:border-brand-400 outline-none" /></div>
                <div><label className="text-xs text-ink-600 font-medium">Telefone / WhatsApp</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 w-full h-11 px-3 rounded-lg border border-ink-100 focus:border-brand-400 outline-none" /></div>
                <div className="col-span-2"><label className="text-xs text-ink-600 font-medium">E-mail</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1 w-full h-11 px-3 rounded-lg border border-ink-100 focus:border-brand-400 outline-none" /></div>
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(3)} className="text-sm text-ink-500 hover:text-brand-600">← Voltar</button>
                <button onClick={finish} disabled={!form.name || !form.phone} className="h-11 px-6 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:bg-ink-200 disabled:cursor-not-allowed">Confirmar agendamento</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8">
              <div className="size-20 rounded-full bg-emerald-50 grid place-items-center mx-auto mb-4"><CheckCircle2 className="size-10 text-grass-500" /></div>
              <h2 className="font-display text-3xl text-ink-800">Consulta agendada!</h2>
              <p className="text-ink-500 mt-2">Enviamos a confirmação para seu WhatsApp e e-mail.</p>
              <div className="mt-6 p-5 rounded-xl bg-ink-50 text-left max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-2"><User className="size-4 text-ink-500" /><div><div className="text-xs text-ink-400">Profissional</div><div className="text-sm font-semibold text-ink-800">{professionals.find(p => p.id === professionalId)?.name}</div></div></div>
                <div className="flex items-center gap-2 mb-2"><CalIcon className="size-4 text-ink-500" /><div><div className="text-xs text-ink-400">Data e horário</div><div className="text-sm font-semibold text-ink-800 capitalize">{fmtDateLong(date)} · {slot}</div></div></div>
                <div className="flex items-center gap-2"><MapPin className="size-4 text-ink-500" /><div><div className="text-xs text-ink-400">Local</div><div className="text-sm font-semibold text-ink-800">{units.find(u => u.id === unitId)?.name}</div><div className="text-xs text-ink-500">{units.find(u => u.id === unitId)?.address}</div></div></div>
              </div>
              <button onClick={() => navigate('/painel')} className="mt-6 text-sm text-brand-600 hover:text-brand-700 font-medium">Ver no sistema Khronos →</button>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-ink-400 mt-6">
          Protegido por criptografia · LGPD compliant · Powered by <strong className="text-brand-700">Khronos</strong>
        </div>
      </div>
    </div>
  );
}
