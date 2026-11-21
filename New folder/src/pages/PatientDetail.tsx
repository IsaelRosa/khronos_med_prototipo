import { useParams, Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Card, Button, Badge, PageHeader } from '../components/ui';
import {
  Phone, Mail, MapPin, Calendar, Heart, AlertTriangle, Pill, FileText,
  Stethoscope, ArrowLeft, MessageSquare, Shield, User, Clock
} from 'lucide-react';
import { age, fmtDate } from '../lib/utils';
import { STATUS_META } from '../lib/statuses';
import { useState } from 'react';

export default function PatientDetail() {
  const { id } = useParams();
  const patient = useStore(s => s.patients.find(p => p.id === id));
  const appointments = useStore(s => s.appointments.filter(a => a.patientId === id));
  const notes = useStore(s => s.soapNotes.filter(n => n.patientId === id));
  const rx = useStore(s => s.prescriptions.filter(p => p.patientId === id));
  const exams = useStore(s => s.examOrders.filter(e => e.patientId === id));
  const financial = useStore(s => s.financial.filter(f => f.patientId === id));
  const professionals = useStore(s => s.professionals);

  const [tab, setTab] = useState<'resumo'|'historico'|'prescricoes'|'exames'|'financeiro'>('resumo');

  if (!patient) return <div className="p-8">Paciente não encontrado. <Link to="/pacientes" className="text-brand-600">Voltar</Link></div>;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <Link to="/pacientes" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft className="size-4" /> Voltar para pacientes
      </Link>

      {/* Patient header */}
      <Card className="p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 khronos-grid opacity-40 pointer-events-none" />
        <div className="relative flex items-start gap-6">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-brand-500 to-aqua-500 grid place-items-center text-white text-2xl font-display">
            {patient.name.split(' ').slice(0,2).map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-[28px] text-ink-900 leading-tight">{patient.name}</h1>
              <Badge tone="brand">{patient.code}</Badge>
            </div>
            <div className="text-sm text-ink-500">{patient.sex === 'F' ? 'Feminino' : patient.sex === 'M' ? 'Masculino' : 'Outro'} · {age(patient.birth)} anos · {fmtDate(patient.birth)}</div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-ink-600"><Phone className="size-3.5 text-ink-400" /> {patient.phone}</span>
              <span className="flex items-center gap-1.5 text-ink-600"><Mail className="size-3.5 text-ink-400" /> {patient.email}</span>
              <span className="flex items-center gap-1.5 text-ink-600"><MapPin className="size-3.5 text-ink-400" /> {patient.address}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="secondary" icon={<MessageSquare className="size-4" />}>WhatsApp</Button>
            <Button size="sm" icon={<Calendar className="size-4" />}>Agendar</Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label:'Consultas', value: appointments.length, icon: Calendar, tone:'brand' },
            { label:'Prontuários', value: notes.length, icon: FileText, tone:'aqua' },
            { label:'Prescrições', value: rx.length, icon: Pill, tone:'grass' },
            { label:'Alergias', value: patient.allergies.length, icon: AlertTriangle, tone: patient.allergies.length ? 'flame':'ink' as const },
          ].map((s,i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50">
              <s.icon className="size-5 text-brand-600" />
              <div><div className="text-lg font-display text-ink-800">{s.value}</div><div className="text-xs text-ink-500">{s.label}</div></div>
            </div>
          ))}
        </div>
      </Card>

      {/* Clinical alerts */}
      {(patient.allergies.length > 0 || patient.medications.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-5 border-l-4 border-l-flame-500">
            <div className="flex items-center gap-2 mb-2 text-flame-600"><AlertTriangle className="size-4" /><span className="text-sm font-semibold">Alergias</span></div>
            {patient.allergies.length ? (
              <div className="flex flex-wrap gap-1.5">{patient.allergies.map(a => <Badge key={a} tone="flame">{a}</Badge>)}</div>
            ) : <div className="text-sm text-ink-500">Nenhuma registrada</div>}
          </Card>
          <Card className="p-5 border-l-4 border-l-brand-500">
            <div className="flex items-center gap-2 mb-2 text-brand-700"><Pill className="size-4" /><span className="text-sm font-semibold">Medicações em uso</span></div>
            {patient.medications.length ? (
              <div className="flex flex-wrap gap-1.5">{patient.medications.map(m => <Badge key={m} tone="brand">{m}</Badge>)}</div>
            ) : <div className="text-sm text-ink-500">Nenhuma registrada</div>}
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-ink-100 mb-6">
        {([
          ['resumo','Resumo'], ['historico','Histórico clínico'], ['prescricoes','Prescrições'], ['exames','Exames'], ['financeiro','Financeiro']
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 h-11 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {notes.length === 0 ? (
              <Card className="p-8 text-center"><FileText className="size-8 mx-auto text-ink-300 mb-2" /><div className="text-ink-500 text-sm">Nenhum prontuário registrado ainda.</div></Card>
            ) : (
              notes.slice().reverse().map(n => (
                <Card key={n.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="size-4 text-brand-600" />
                        <span className="font-semibold text-ink-800">{professionals.find(p => p.id === n.professionalId)?.name}</span>
                        {n.signed && <Badge tone="grass"><Shield className="size-3" /> Assinado</Badge>}
                      </div>
                      <div className="text-xs text-ink-500">{fmtDate(n.date)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-ink-50 rounded-xl">
                    {n.pa && <div><div className="text-[10px] uppercase text-ink-400">PA</div><div className="font-mono text-ink-800">{n.pa}</div></div>}
                    {n.fc && <div><div className="text-[10px] uppercase text-ink-400">FC</div><div className="font-mono text-ink-800">{n.fc} bpm</div></div>}
                    {n.spo2 && <div><div className="text-[10px] uppercase text-ink-400">SpO₂</div><div className="font-mono text-ink-800">{n.spo2}%</div></div>}
                    {n.temp && <div><div className="text-[10px] uppercase text-ink-400">Temp</div><div className="font-mono text-ink-800">{n.temp}°C</div></div>}
                  </div>
                  <div className="space-y-3 text-sm">
                    {([['S — Subjetivo', n.subjetivo],['O — Objetivo', n.objetivo],['A — Avaliação', n.avaliacao],['P — Plano', n.plano]] as const).map(([l,v]) => (
                      <div key={l}><div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{l}</div><div className="text-ink-700">{v}</div></div>
                    ))}
                  </div>
                  {n.diagnostico && <div className="mt-4 pt-4 border-t border-ink-100 flex items-center gap-4 text-sm">
                    <Badge tone="brand">CID {n.diagnostico}</Badge>
                    {n.retorno && <span className="text-ink-500"><Clock className="size-3.5 inline" /> Retorno em {fmtDate(n.retorno)}</span>}
                  </div>}
                </Card>
              ))
            )}
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card className="p-5">
              <h3 className="font-display text-lg text-ink-800 mb-3">Próximos agendamentos</h3>
              {appointments.filter(a => a.date >= new Date().toISOString().slice(0,10) && a.status !== 'cancelado').slice(0,5).map(a => {
                const st = STATUS_META[a.status];
                const pr = professionals.find(p => p.id === a.professionalId);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-ink-100 mb-2">
                    <div className="text-center"><div className="text-[10px] text-ink-400">{fmtDate(a.date).slice(0,5)}</div><div className="text-sm font-mono font-semibold text-ink-800">{a.start}</div></div>
                    <div className="flex-1 min-w-0"><div className="text-sm text-ink-800 truncate">{a.procedure}</div><div className="text-xs text-ink-500">{pr?.name}</div></div>
                    <Badge tone={st.color.includes('grass')?'grass':'ink' as any}>{st.label}</Badge>
                  </div>
                );
              })}
            </Card>
            <Card className="p-5">
              <h3 className="font-display text-lg text-ink-800 mb-3">Dados cadastrais</h3>
              <dl className="text-sm space-y-2">
                <div><dt className="text-xs text-ink-400">CPF</dt><dd className="text-ink-700 font-mono">{patient.cpf}</dd></div>
                <div><dt className="text-xs text-ink-400">Convênio</dt><dd className="text-ink-700">{patient.insurance} {patient.insuranceCard && `· ${patient.insuranceCard}`}</dd></div>
                <div><dt className="text-xs text-ink-400">Emergência</dt><dd className="text-ink-700">{patient.emergencyContact}</dd></div>
              </dl>
            </Card>
          </div>
        </div>
      )}

      {tab === 'historico' && (
        <Card className="p-6">
          <h3 className="font-display text-lg text-ink-800 mb-4">Histórico de consultas</h3>
          <div className="space-y-3">
            {appointments.slice().reverse().map(a => {
              const st = STATUS_META[a.status];
              const pr = professionals.find(p => p.id === a.professionalId);
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-ink-100">
                  <Calendar className="size-5 text-ink-400" />
                  <div className="flex-1">
                    <div className="text-sm text-ink-800">{fmtDate(a.date)} · {a.start}</div>
                    <div className="text-xs text-ink-500">{a.procedure} · {pr?.name}</div>
                  </div>
                  <Badge tone={st.color.includes('grass')?'grass':'ink' as any}>{st.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'prescricoes' && (
        <div className="space-y-4">
          {rx.map(p => (
            <Card key={p.id} className="p-6">
              <div className="flex items-center justify-between mb-3"><h4 className="font-display text-lg text-ink-800">Receita de {fmtDate(p.date)}</h4><Badge tone="brand">{p.type}</Badge></div>
              {p.items.map((i, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-ink-50 mb-2">
                  <div className="font-medium text-ink-800">{idx+1}. {i.medication}</div>
                  <div className="text-sm text-ink-500 mt-0.5">{i.dosage} · {i.route} · {i.frequency} · {i.duration}</div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {tab === 'exames' && (
        <div className="space-y-4">
          {exams.map(e => (
            <Card key={e.id} className="p-6">
              <div className="flex items-center justify-between mb-3"><h4 className="font-display text-lg text-ink-800">Solicitação — {fmtDate(e.date)}</h4><Badge tone={e.status === 'concluido' ? 'grass' : 'honey'}>{e.status}</Badge></div>
              {e.exams.map((x,i) => (
                <div key={i} className="py-2 border-b last:border-0 border-ink-100 flex items-center justify-between">
                  <div><div className="text-sm text-ink-800">{x.name}</div><div className="text-xs text-ink-400">{x.code}</div></div>
                  {x.justification && <div className="text-xs text-ink-500 max-w-md">{x.justification}</div>}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {tab === 'financeiro' && (
        <Card className="p-6">
          <h3 className="font-display text-lg text-ink-800 mb-4">Histórico financeiro</h3>
          {financial.length === 0 ? <div className="text-sm text-ink-500">Nenhum lançamento vinculado.</div> : (
            <table className="w-full text-sm"><thead><tr className="text-xs text-ink-400 text-left border-b border-ink-100"><th className="py-2">Data</th><th>Descrição</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {financial.map(f => <tr key={f.id}><td className="py-2">{fmtDate(f.date)}</td><td>{f.description}</td><td className="font-mono">{f.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td><td><Badge tone={f.status === 'pago' ? 'grass' : 'honey'}>{f.status}</Badge></td></tr>)}
            </tbody></table>
          )}
        </Card>
      )}
    </div>
  );
}
