import { useState } from 'react';
import { useStore } from '../lib/store';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { fmtDate } from '../lib/utils';
import { FileText, Shield, Search, Filter, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Records() {
  const notes = useStore(s => s.soapNotes);
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const [q, setQ] = useState('');

  const filtered = notes.filter(n => {
    if (!q) return true;
    const p = patients.find(pt => pt.id === n.patientId);
    return p?.name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Prontuários" title="Prontuário eletrônico" subtitle="Estrutura SOAP com auditoria, assinatura eletrônica e proibição de edição silenciosa.">
        <Button variant="secondary" size="sm" icon={<Filter className="size-4" />}>Filtros</Button>
      </PageHeader>

      <Card className="p-3 mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por paciente, CID ou profissional..." className="w-full h-10 pl-10 pr-4 rounded-lg bg-ink-50 border border-ink-100 text-sm focus:bg-white focus:border-brand-400 outline-none" />
        </div>
      </Card>

      <div className="grid gap-4">
        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="size-10 mx-auto text-ink-300 mb-3" />
            <h3 className="font-display text-lg text-ink-800">Nenhum prontuário ainda</h3>
            <p className="text-sm text-ink-500 mb-4">Inicie um atendimento para registrar o primeiro prontuário SOAP.</p>
            <Link to="/atendimento"><Button icon={<Stethoscope className="size-4" />}>Ir para atendimento</Button></Link>
          </Card>
        )}
        {filtered.map(n => {
          const p = patients.find(pt => pt.id === n.patientId);
          const pr = professionals.find(prof => prof.id === n.professionalId);
          return (
            <Card key={n.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center font-semibold">
                    {p?.name.split(' ').slice(0,2).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <Link to={`/pacientes/${p?.id}`} className="font-display text-lg text-ink-800 hover:text-brand-600">{p?.name}</Link>
                    <div className="text-sm text-ink-500 flex items-center gap-2 mt-0.5">
                      <span>{fmtDate(n.date)}</span>·<span>{pr?.name} — {pr?.specialty}</span>
                      {n.signed && <Badge tone="grass"><Shield className="size-3" /> Assinado</Badge>}
                    </div>
                  </div>
                </div>
                {n.diagnostico && <Badge tone="brand">CID {n.diagnostico}</Badge>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-ink-50"><div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-0.5">Queixa principal</div><div className="text-ink-700">{n.queixa}</div></div>
                <div className="p-3 rounded-lg bg-ink-50"><div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-0.5">Avaliação</div><div className="text-ink-700">{n.avaliacao}</div></div>
                <div className="p-3 rounded-lg bg-ink-50 md:col-span-2"><div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-0.5">Plano</div><div className="text-ink-700">{n.plano}</div></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
