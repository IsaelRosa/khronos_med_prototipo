import { useState } from 'react';
import { useStore, actions } from '../lib/store';
import { Card, PageHeader, Button, Modal, Field, selectCls, textareaCls, Badge, inputCls } from '../components/ui';
import { examCatalog } from '../lib/mock';
import { fmtDate, todayISO } from '../lib/utils';
import { Microscope, Plus, Trash2, Search, Upload, CheckCircle2 } from 'lucide-react';

export default function Exams() {
  const examOrders = useStore(s => s.examOrders);
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const catalog = examCatalog.filter(e => !q || e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Exames & procedimentos" title="Solicitações e resultados" subtitle="Catálogo completo, vinculação ao prontuário e anexo de laudos.">
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Nova solicitação</Button>
      </PageHeader>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {examOrders.length === 0 && (
            <Card className="p-12 text-center">
              <Microscope className="size-10 mx-auto text-ink-300 mb-3" />
              <div className="font-display text-lg text-ink-800">Nenhuma solicitação</div>
              <p className="text-sm text-ink-500 mb-4">Crie a primeira ordem de exame.</p>
              <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Nova solicitação</Button>
            </Card>
          )}
          {examOrders.map(order => {
            const pt = patients.find(p => p.id === order.patientId);
            const pr = professionals.find(p => p.id === order.professionalId);
            return (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-display text-lg text-ink-800">Solicitação — {pt?.name}</div>
                    <div className="text-sm text-ink-500">{fmtDate(order.date)} · {pr?.name}</div>
                  </div>
                  <Badge tone={order.status === 'concluido' ? 'grass' : order.status === 'em_andamento' ? 'honey' : 'brand'}>
                    {order.status === 'em_andamento' ? 'Em andamento' : order.status === 'concluido' ? 'Concluído' : 'Solicitado'}
                  </Badge>
                </div>
                <div className="divide-y divide-ink-100">
                  {order.exams.map((e, i) => (
                    <div key={i} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-ink-800">{e.name}</div>
                        <div className="text-xs text-ink-400 font-mono">{e.code}</div>
                        {e.justification && <div className="text-xs text-ink-500 mt-1 italic">“{e.justification}”</div>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" icon={<Upload className="size-3.5" />}>Anexar resultado</Button>
                        <Button size="sm" variant="secondary" icon={<CheckCircle2 className="size-3.5" />}>Concluir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">Catálogo</div>
            <h4 className="font-display text-lg text-ink-800 mb-3">Exames disponíveis</h4>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar exame..." className="w-full h-9 pl-10 pr-3 rounded-lg bg-ink-50 border border-ink-100 text-sm focus:bg-white outline-none" />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {catalog.map(e => (
                <div key={e.code} className="p-3 rounded-lg hover:bg-ink-50 border border-ink-100">
                  <div className="text-sm font-medium text-ink-800">{e.name}</div>
                  <div className="flex items-center justify-between mt-1"><span className="text-xs text-ink-400 font-mono">{e.code}</span><Badge tone="brand">{e.category}</Badge></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <NewExamModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewExamModal({ open, onClose }:{ open: boolean; onClose:()=>void }) {
  const patients = useStore(s => s.patients);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [exams, setExams] = useState<{name:string; code?:string; justification?:string}[]>([{ name:'', justification:'' }]);

  function save() {
    actions.addExam({ patientId, professionalId:'p1', date: todayISO(), exams, status:'solicitado' });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova solicitação de exame" size="lg">
      <Field label="Paciente"><select value={patientId} onChange={e => setPatientId(e.target.value)} className={selectCls}>
        {patients.slice(0,20).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select></Field>
      <div className="mt-4 space-y-3">
        {exams.map((ex, i) => (
          <div key={i} className="p-3 rounded-xl bg-ink-50 border border-ink-100">
            <div className="flex items-center gap-2 mb-2"><span className="text-sm font-semibold text-ink-700">Exame {i+1}</span>
              {exams.length > 1 && <button onClick={() => setExams(exams.filter((_,idx) => idx !== i))} className="ml-auto text-flame-500"><Trash2 className="size-4" /></button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome do exame"><input list={`cat-${i}`} value={ex.name} onChange={e => setExams(exams.map((x,idx) => idx === i ? {...x, name: e.target.value, code: examCatalog.find(c => c.name === e.target.value)?.code} : x))} className={inputCls} />
                <datalist id={`cat-${i}`}>{examCatalog.map(c => <option key={c.code} value={c.name} />)}</datalist>
              </Field>
              <Field label="Justificativa clínica"><input value={ex.justification ?? ''} onChange={e => setExams(exams.map((x,idx) => idx === i ? {...x, justification: e.target.value} : x))} className={inputCls} /></Field>
            </div>
          </div>
        ))}
        <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setExams([...exams, {name:''}])}>Adicionar exame</Button>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save}>Emitir solicitação</Button>
      </div>
    </Modal>
  );
}
