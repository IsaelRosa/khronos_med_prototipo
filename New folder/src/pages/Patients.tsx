import { useState, useMemo } from 'react';
import { useStore, actions } from '../lib/store';
import { Card, PageHeader, Button, Modal, Field, inputCls, selectCls, textareaCls, Badge } from '../components/ui';
import { Search, Plus, Filter, UserPlus, Phone, Mail, MapPin, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { age, fmtDate } from '../lib/utils';

export default function Patients() {
  const patients = useStore(s => s.patients);
  const [query, setQuery] = useState('');
  const [insurance, setInsurance] = useState('all');
  const [sex, setSex] = useState('all');
  const [newOpen, setNewOpen] = useState(false);

  const insurances = Array.from(new Set(patients.map(p => p.insurance).filter(Boolean))) as string[];

  const filtered = useMemo(() => patients.filter(p => {
    if (query) {
      const q = query.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.cpf.includes(query) && !p.code.toLowerCase().includes(q)) return false;
    }
    if (insurance !== 'all' && p.insurance !== insurance) return false;
    if (sex !== 'all' && p.sex !== sex) return false;
    return true;
  }), [patients, query, insurance, sex]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Pacientes" title="Base de pacientes" subtitle={`${patients.length} cadastrados · busca rápida por nome, CPF, telefone ou código.`}>
        <Button variant="secondary" size="sm" icon={<Download className="size-4" />}>Exportar</Button>
        <Button size="sm" icon={<UserPlus className="size-4" />} onClick={() => setNewOpen(true)}>Novo paciente</Button>
      </PageHeader>

      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, CPF, código ou telefone…"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-ink-50 border border-ink-100 text-sm focus:bg-white focus:border-brand-400 outline-none" />
        </div>
        <select value={insurance} onChange={e => setInsurance(e.target.value)} className={selectCls + ' w-auto'}>
          <option value="all">Todos os convênios</option>
          {insurances.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={sex} onChange={e => setSex(e.target.value)} className={selectCls + ' w-auto'}>
          <option value="all">Sexo</option>
          <option value="F">Feminino</option>
          <option value="M">Masculino</option>
        </select>
        <Button variant="ghost" size="sm" icon={<Filter className="size-4" />}>Mais filtros</Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50">
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
                <th className="px-5 py-3 font-semibold">Paciente</th>
                <th className="px-5 py-3 font-semibold">CPF</th>
                <th className="px-5 py-3 font-semibold">Idade</th>
                <th className="px-5 py-3 font-semibold">Contato</th>
                <th className="px-5 py-3 font-semibold">Convênio</th>
                <th className="px-5 py-3 font-semibold">Última visita</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.slice(0, 25).map(p => (
                <tr key={p.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3">
                    <Link to={`/pacientes/${p.id}`} className="flex items-center gap-3 group">
                      <div className="size-10 rounded-full bg-gradient-to-br from-brand-400 to-aqua-500 grid place-items-center text-white text-xs font-semibold">
                        {p.name.split(' ').slice(0,2).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-ink-800 group-hover:text-brand-600">{p.name}</div>
                        <div className="text-xs text-ink-400 font-mono">{p.code}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-600 font-mono text-[13px]">{p.cpf}</td>
                  <td className="px-5 py-3 text-ink-600">{age(p.birth)} anos</td>
                  <td className="px-5 py-3">
                    <div className="text-ink-700 text-xs flex items-center gap-1"><Phone className="size-3 text-ink-400" /> {p.phone}</div>
                    <div className="text-ink-500 text-xs flex items-center gap-1"><Mail className="size-3 text-ink-400" /> {p.email}</div>
                  </td>
                  <td className="px-5 py-3"><Badge tone={p.insurance === 'Particular' ? 'ink' : 'brand'}>{p.insurance}</Badge></td>
                  <td className="px-5 py-3 text-ink-500 text-xs">{p.lastVisit && fmtDate(p.lastVisit)}</td>
                  <td className="px-5 py-3">
                    <Link to={`/pacientes/${p.id}`} className="text-brand-600 text-xs font-medium hover:text-brand-700">Ver prontuário →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
          <div>Exibindo {Math.min(filtered.length, 25)} de {filtered.length} pacientes</div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 hover:bg-ink-100 rounded">Anterior</button>
            <button className="px-2 py-1 bg-brand-500 text-white rounded">1</button>
            <button className="px-2 py-1 hover:bg-ink-100 rounded">2</button>
            <button className="px-2 py-1 hover:bg-ink-100 rounded">Próxima</button>
          </div>
        </div>
      </Card>

      <NewPatientModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

function NewPatientModal({ open, onClose }:{ open: boolean; onClose: ()=>void }) {
  const [form, setForm] = useState({
    name:'', cpf:'', birth:'', sex:'F' as 'M'|'F'|'O', phone:'', whatsapp:'', email:'',
    address:'', emergencyContact:'', insurance:'Particular', insuranceCard:'', notes:''
  });
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    if (!form.name) return;
    actions.addPatient({ ...form, allergies: [], medications: [] });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Cadastrar paciente" size="xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label="Nome completo"><input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} /></Field></div>
        <Field label="CPF"><input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" className={inputCls} /></Field>
        <Field label="Nascimento"><input type="date" value={form.birth} onChange={e => set('birth', e.target.value)} className={inputCls} /></Field>
        <Field label="Sexo"><select value={form.sex} onChange={e => set('sex', e.target.value)} className={selectCls}>
          <option value="F">Feminino</option><option value="M">Masculino</option><option value="O">Outro</option>
        </select></Field>
        <Field label="Telefone"><input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} /></Field>
        <Field label="WhatsApp"><input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={inputCls} /></Field>
        <Field label="E-mail"><input value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} /></Field>
        <div className="col-span-2"><Field label="Endereço"><input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} /></Field></div>
        <Field label="Contato de emergência"><input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} className={inputCls} /></Field>
        <Field label="Convênio"><input value={form.insurance} onChange={e => set('insurance', e.target.value)} className={inputCls} /></Field>
        <Field label="Carteirinha"><input value={form.insuranceCard} onChange={e => set('insuranceCard', e.target.value)} className={inputCls} /></Field>
        <Field label=""><div className="invisible">.</div></Field>
        <div className="col-span-2"><Field label="Observações"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={textareaCls} rows={3} /></Field></div>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} icon={<Plus className="size-4" />}>Cadastrar paciente</Button>
      </div>
    </Modal>
  );
}
