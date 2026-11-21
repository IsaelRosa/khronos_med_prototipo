import { useState } from 'react';
import { useStore, actions } from '../lib/store';
import { Card, PageHeader, Button, Modal, Field, inputCls, textareaCls, selectCls, Badge } from '../components/ui';
import { commonMedications } from '../lib/mock';
import { fmtDate, todayISO } from '../lib/utils';
import { Pill, Plus, Printer, Trash2, FileText, Download, Shield } from 'lucide-react';
import type { PrescriptionItem } from '../lib/types';

export default function Prescriptions() {
  const prescriptions = useStore(s => s.prescriptions);
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const [newOpen, setNewOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Prescrições" title="Prescrições e documentos" subtitle="Emita receitas simples, especiais e antimicrobianas com integração para assinatura digital.">
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setNewOpen(true)}>Nova prescrição</Button>
      </PageHeader>

      {/* Document types */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          ['Receita simples', Pill, 'brand'],
          ['Receita especial', Pill, 'violet'],
          ['Antimicrobiano', Pill, 'honey'],
          ['Pedido de exames', FileText, 'aqua'],
          ['Atestado médico', FileText, 'grass'],
        ].map(([label, Icon, tone]: any) => (
          <Card key={label} className="p-4 hover:shadow-md transition cursor-pointer" onClick={() => setNewOpen(true)}>
            <div className={`size-10 rounded-xl grid place-items-center mb-2 bg-${tone}-50`}>
              <Icon className={`size-5 text-${tone}-600`} />
            </div>
            <div className="text-sm font-semibold text-ink-800">{label}</div>
            <div className="text-xs text-ink-500">Modelo padrão</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {prescriptions.length === 0 && (
          <Card className="p-12 text-center">
            <Pill className="size-10 mx-auto text-ink-300 mb-3" />
            <h3 className="font-display text-lg text-ink-800">Nenhuma prescrição</h3>
            <p className="text-sm text-ink-500 mb-4">Crie sua primeira receita digital.</p>
            <Button icon={<Plus className="size-4" />} onClick={() => setNewOpen(true)}>Nova prescrição</Button>
          </Card>
        )}
        {prescriptions.slice().reverse().map(p => {
          const pt = patients.find(x => x.id === p.patientId);
          const pr = professionals.find(x => x.id === p.professionalId);
          return (
            <Card key={p.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-brand-50 text-brand-600 grid place-items-center"><Pill className="size-5" /></div>
                  <div>
                    <div className="font-display text-lg text-ink-800">Receita — {pt?.name}</div>
                    <div className="text-sm text-ink-500 mt-0.5">{fmtDate(p.date)} · {pr?.name} · {pr?.specialty}</div>
                    <div className="flex gap-2 mt-2"><Badge tone="brand">{p.type}</Badge><Badge tone="grass"><Shield className="size-3" /> Assinado</Badge></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" icon={<Printer className="size-4" />} onClick={() => setPreviewId(p.id)}>Imprimir</Button>
                  <Button size="sm" variant="secondary" icon={<Download className="size-4" />}>PDF</Button>
                </div>
              </div>
              <div className="divide-y divide-ink-100">
                {p.items.map((it, idx) => (
                  <div key={idx} className="py-3">
                    <div className="font-medium text-ink-800">{idx+1}. {it.medication}</div>
                    <div className="text-sm text-ink-600 mt-0.5">{it.dosage} · {it.route} · {it.frequency} · {it.duration}</div>
                    <div className="text-xs text-ink-500 mt-0.5">Quantidade: {it.quantity}</div>
                  </div>
                ))}
              </div>
              {p.observations && <div className="mt-3 p-3 bg-ink-50 rounded-lg text-sm text-ink-600"><strong>Obs.:</strong> {p.observations}</div>}
            </Card>
          );
        })}
      </div>

      <NewPrescriptionModal open={newOpen} onClose={() => setNewOpen(false)} />
      <PreviewModal id={previewId} onClose={() => setPreviewId(null)} />
    </div>
  );
}

function NewPrescriptionModal({ open, onClose }:{ open: boolean; onClose:()=>void }) {
  const patients = useStore(s => s.patients);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [type, setType] = useState<'simples'|'especial'|'antimicrobiano'>('simples');
  const [items, setItems] = useState<PrescriptionItem[]>([{ medication:'', dosage:'1 comprimido', route:'Via oral', frequency:'1x ao dia', duration:'30 dias', quantity:'30 comprimidos' }]);
  const [observations, setObservations] = useState('');

  function addItem() {
    setItems([...items, { medication:'', dosage:'1 comprimido', route:'Via oral', frequency:'1x ao dia', duration:'30 dias', quantity:'30 comprimidos' }]);
  }
  function updateItem(i:number, patch: Partial<PrescriptionItem>) {
    setItems(items.map((it,idx) => idx === i ? { ...it, ...patch } : it));
  }
  function removeItem(i:number) { setItems(items.filter((_,idx) => idx !== i)); }

  function save() {
    actions.addPrescription({ patientId, professionalId:'p1', date: todayISO(), items, observations, type });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova prescrição" size="xl">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <Field label="Paciente"><select value={patientId} onChange={e => setPatientId(e.target.value)} className={selectCls}>
          {patients.slice(0,20).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></Field>
        <Field label="Tipo de receita"><select value={type} onChange={e => setType(e.target.value as any)} className={selectCls}>
          <option value="simples">Receita simples</option>
          <option value="especial">Receita especial (controlada)</option>
          <option value="antimicrobiano">Antimicrobiano</option>
        </select></Field>
      </div>

      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="p-4 rounded-xl bg-ink-50 border border-ink-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-full bg-brand-500 text-white grid place-items-center text-xs font-semibold">{i+1}</div>
              <div className="text-sm font-semibold text-ink-800 flex-1">Medicamento</div>
              {items.length > 1 && <button onClick={() => removeItem(i)} className="text-flame-500 hover:text-flame-600"><Trash2 className="size-4" /></button>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="col-span-2 md:col-span-3">
                <Field label="Medicamento">
                  <input list={`meds-${i}`} value={it.medication} onChange={e => updateItem(i, { medication: e.target.value })} className={inputCls} placeholder="Digite ou escolha" />
                  <datalist id={`meds-${i}`}>
                    {commonMedications.map(m => <option key={m.name} value={m.name} />)}
                  </datalist>
                </Field>
              </div>
              <Field label="Dose"><input value={it.dosage} onChange={e => updateItem(i, { dosage: e.target.value })} className={inputCls} /></Field>
              <Field label="Via"><input value={it.route} onChange={e => updateItem(i, { route: e.target.value })} className={inputCls} /></Field>
              <Field label="Frequência"><input value={it.frequency} onChange={e => updateItem(i, { frequency: e.target.value })} className={inputCls} /></Field>
              <Field label="Duração"><input value={it.duration} onChange={e => updateItem(i, { duration: e.target.value })} className={inputCls} /></Field>
              <Field label="Quantidade"><input value={it.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} className={inputCls} /></Field>
              <div className="col-span-2 md:col-span-3">
                <Field label="Orientações"><input value={it.notes ?? ''} onChange={e => updateItem(i, { notes: e.target.value })} className={inputCls} placeholder="Ex: tomar com alimento" /></Field>
              </div>
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<Plus className="size-4" />} onClick={addItem}>Adicionar medicamento</Button>
      </div>

      <div className="mt-4"><Field label="Observações gerais"><textarea value={observations} onChange={e => setObservations(e.target.value)} className={textareaCls} rows={2} /></Field></div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} icon={<Shield className="size-4" />}>Assinar e emitir</Button>
      </div>
    </Modal>
  );
}

function PreviewModal({ id, onClose }:{ id: string | null; onClose:()=>void }) {
  const rx = useStore(s => s.prescriptions.find(p => p.id === id));
  const patient = useStore(s => s.patients.find(p => p.id === rx?.patientId));
  const pr = useStore(s => s.professionals.find(p => p.id === rx?.professionalId));
  const clinic = useStore(s => s.clinic);
  if (!id || !rx || !patient || !pr) return null;
  return (
    <Modal open={!!id} onClose={onClose} title="Pré-visualização — Receituário" size="xl">
      <div className="bg-white p-10 rounded-lg border border-ink-100 font-serif" style={{fontFamily: 'Fraunces, Georgia, serif'}}>
        <div className="flex items-center justify-between pb-4 border-b-2 border-brand-700">
          <div>
            <div className="text-xl font-bold text-brand-900">{clinic.name}</div>
            <div className="text-sm text-ink-600">{clinic.cnpj} · {clinic.units[0].address}</div>
          </div>
          <div className="text-right text-sm text-ink-700">
            <div className="font-semibold">{pr.name}</div>
            <div>{pr.specialty}</div>
            <div>{pr.crm}</div>
          </div>
        </div>
        <div className="mt-6 text-center uppercase text-sm tracking-widest text-brand-700">{rx.type === 'simples' ? 'Receituário' : rx.type === 'especial' ? 'Receituário Especial' : 'Antimicrobiano'}</div>
        <div className="mt-4 text-sm text-ink-700">
          <div><strong>Paciente:</strong> {patient.name} — CPF {patient.cpf}</div>
          <div><strong>Data:</strong> {fmtDate(rx.date)}</div>
        </div>
        <ol className="mt-6 space-y-4 text-ink-800">
          {rx.items.map((it, i) => (
            <li key={i}>
              <div className="text-lg">{it.medication}</div>
              <div className="text-sm text-ink-600">{it.dosage} — {it.route} — {it.frequency} — {it.duration}</div>
              <div className="text-sm text-ink-500 italic">{it.quantity}{it.notes ? ` — ${it.notes}` : ''}</div>
            </li>
          ))}
        </ol>
        {rx.observations && <p className="mt-6 text-sm text-ink-700">{rx.observations}</p>}
        <div className="mt-16 border-t border-ink-300 pt-3 text-center text-sm text-ink-600">
          _________________________________________<br />
          {pr.name} — {pr.crm}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>Imprimir</Button>
      </div>
    </Modal>
  );
}
