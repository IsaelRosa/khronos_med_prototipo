import { useStore } from '../lib/store';
import { Card, PageHeader, Button, Badge } from '../components/ui';
import { Building2, Users, Stethoscope, Shield, Package, Plus, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { fmtDate } from '../lib/utils';

export default function Management() {
  const [tab, setTab] = useState<'unidades'|'profissionais'|'equipe'|'estoque'|'auditoria'>('unidades');

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Gestão da clínica" title="Administração multi-unidade" subtitle="Unidades, profissionais, equipe, estoque e auditoria de ações." />

      <div className="flex items-center gap-1 border-b border-ink-100 mb-6">
        {([
          ['unidades','Unidades', Building2],
          ['profissionais','Profissionais', Stethoscope],
          ['equipe','Equipe e RBAC', Users],
          ['estoque','Estoque', Package],
          ['auditoria','Auditoria', Shield],
        ] as const).map(([k,l,Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 h-11 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${tab === k ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'}`}>
            <Icon className="size-4" /> {l}
          </button>
        ))}
      </div>

      {tab === 'unidades' && <Unidades />}
      {tab === 'profissionais' && <Profissionais />}
      {tab === 'equipe' && <Equipe />}
      {tab === 'estoque' && <Estoque />}
      {tab === 'auditoria' && <Auditoria />}
    </div>
  );
}

function Unidades() {
  const units = useStore(s => s.units);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {units.map(u => (
        <Card key={u.id} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="size-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center mb-3"><Building2 className="size-5" /></div>
              <h3 className="font-display text-lg text-ink-800">{u.name}</h3>
              <p className="text-sm text-ink-500 mt-1">{u.address}</p>
              <div className="text-sm text-ink-600 mt-2">{u.phone}</div>
            </div>
            <Badge tone="grass">Ativa</Badge>
          </div>
          <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-3 gap-4 text-center">
            <div><div className="text-xl font-display text-ink-800">6</div><div className="text-xs text-ink-500">Consultórios</div></div>
            <div><div className="text-xl font-display text-ink-800">14</div><div className="text-xs text-ink-500">Profissionais</div></div>
            <div><div className="text-xl font-display text-ink-800">52</div><div className="text-xs text-ink-500">Consultas/dia</div></div>
          </div>
        </Card>
      ))}
      <button className="rounded-2xl border-2 border-dashed border-ink-200 p-6 grid place-items-center text-ink-500 hover:border-brand-400 hover:text-brand-600 transition">
        <div className="text-center"><Plus className="size-8 mx-auto mb-2" /><div className="text-sm font-medium">Adicionar nova unidade</div></div>
      </button>
    </div>
  );
}

function Profissionais() {
  const professionals = useStore(s => s.professionals);
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-50"><tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
          <th className="px-5 py-3 font-semibold">Profissional</th>
          <th className="px-5 py-3 font-semibold">Especialidade</th>
          <th className="px-5 py-3 font-semibold">CRM</th>
          <th className="px-5 py-3 font-semibold">Unidades</th>
          <th className="px-5 py-3 font-semibold">Repasse</th>
        </tr></thead>
        <tbody className="divide-y divide-ink-100">
          {professionals.map(p => (
            <tr key={p.id} className="hover:bg-ink-50/50">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="size-9 rounded-full grid place-items-center text-white text-xs font-semibold" style={{backgroundColor: p.color}}>{p.name.split(' ').slice(0,2).map(n => n[0]).join('')}</div><span className="text-ink-800 font-medium">{p.name}</span></div></td>
              <td className="px-5 py-3"><Badge tone="brand">{p.specialty}</Badge></td>
              <td className="px-5 py-3 text-ink-600 font-mono text-xs">{p.crm}</td>
              <td className="px-5 py-3 text-ink-600 text-xs">{p.unitIds.length} unidade(s)</td>
              <td className="px-5 py-3 text-ink-800 font-semibold">{p.repasse}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Equipe() {
  const roles = [
    { role: 'Superadmin', count: 1, color: 'bg-violet-500', perms: ['Acesso total', 'Multi-clínica'] },
    { role: 'Admin Clínica', count: 2, color: 'bg-brand-600', perms: ['Gestão completa da clínica', 'Configurações'] },
    { role: 'Médico', count: 6, color: 'bg-aqua-500', perms: ['Prontuários', 'Prescrições', 'Atendimento'] },
    { role: 'Recepção', count: 4, color: 'bg-grass-500', perms: ['Agendamentos', 'Cadastro', 'Confirmações'] },
    { role: 'Financeiro', count: 2, color: 'bg-honey-500', perms: ['Lançamentos', 'Relatórios', 'Convênios'] },
    { role: 'Enfermeiro', count: 3, color: 'bg-brand-400', perms: ['Triagem', 'Sinais vitais'] },
  ];
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-r from-brand-50 to-aqua-50 border-brand-100">
        <div className="flex items-center gap-3"><Shield className="size-5 text-brand-600" />
          <div><div className="font-semibold text-ink-800">Controle de acesso baseado em funções (RBAC)</div><div className="text-sm text-ink-600">Permissões aplicadas no backend. Recepção e Financeiro não acessam dados clínicos sensíveis.</div></div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(r => (
          <Card key={r.role} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`size-10 rounded-xl ${r.color} grid place-items-center text-white`}><Users className="size-5" /></div>
              <div><div className="font-semibold text-ink-800">{r.role}</div><div className="text-xs text-ink-500">{r.count} membro(s)</div></div>
            </div>
            <div className="space-y-1">
              {r.perms.map(p => <div key={p} className="text-xs text-ink-600 flex items-center gap-1.5"><span className="size-1 rounded-full bg-brand-500" /> {p}</div>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Estoque() {
  const stock = useStore(s => s.stock);
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-ink-100 flex items-center justify-between">
        <div><div className="text-sm font-semibold text-ink-800">Controle de estoque</div><div className="text-xs text-ink-500">{stock.filter(s => s.quantity < s.min).length} item(s) abaixo do mínimo</div></div>
        <Button size="sm" icon={<Plus className="size-4" />}>Nova entrada</Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-ink-50"><tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
          <th className="px-5 py-3 font-semibold">Item</th>
          <th className="px-5 py-3 font-semibold">Categoria</th>
          <th className="px-5 py-3 font-semibold">Lote</th>
          <th className="px-5 py-3 font-semibold">Validade</th>
          <th className="px-5 py-3 font-semibold">Quantidade</th>
          <th className="px-5 py-3 font-semibold">Status</th>
        </tr></thead>
        <tbody className="divide-y divide-ink-100">
          {stock.map(it => {
            const low = it.quantity < it.min;
            const expiringSoon = new Date(it.expiry) < new Date(new Date().getFullYear(), new Date().getMonth()+3, 0);
            return (
              <tr key={it.id}>
                <td className="px-5 py-3 text-ink-800 font-medium">{it.name}</td>
                <td className="px-5 py-3"><Badge tone="brand">{it.category}</Badge></td>
                <td className="px-5 py-3 text-ink-600 font-mono text-xs">{it.lot}</td>
                <td className="px-5 py-3 text-ink-600">{fmtDate(it.expiry)}</td>
                <td className="px-5 py-3 font-mono">{it.quantity} {it.unit} <span className="text-ink-400">/ mín {it.min}</span></td>
                <td className="px-5 py-3">
                  {low && <Badge tone="flame"><AlertTriangle className="size-3" /> Abaixo do mínimo</Badge>}
                  {!low && expiringSoon && <Badge tone="honey">Vence em breve</Badge>}
                  {!low && !expiringSoon && <Badge tone="grass">OK</Badge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function Auditoria() {
  const audits = useStore(s => s.audits);
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-ink-100"><div className="text-sm font-semibold text-ink-800">Trilha de auditoria</div><div className="text-xs text-ink-500">Todas as ações críticas são registradas e imutáveis.</div></div>
      <table className="w-full text-sm"><thead className="bg-ink-50"><tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
        <th className="px-5 py-3 font-semibold">Usuário</th>
        <th className="px-5 py-3 font-semibold">Ação</th>
        <th className="px-5 py-3 font-semibold">Entidade</th>
        <th className="px-5 py-3 font-semibold">Data/hora</th>
      </tr></thead><tbody className="divide-y divide-ink-100">
        {audits.map(a => <tr key={a.id}><td className="px-5 py-3 text-ink-800">{a.user}</td><td className="px-5 py-3 text-ink-700">{a.action}</td><td className="px-5 py-3"><Badge tone="ink">{a.entity}</Badge></td><td className="px-5 py-3 text-ink-500 font-mono text-xs">{a.at}</td></tr>)}
      </tbody></table>
    </Card>
  );
}
