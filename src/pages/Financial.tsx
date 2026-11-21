import { useMemo, useState } from 'react';
import { useStore, actions } from '../lib/store';
import { Card, PageHeader, Button, Modal, Field, inputCls, selectCls, Badge } from '../components/ui';
import { brl, fmtDate, todayISO } from '../lib/utils';
import {
  TrendingUp, TrendingDown, Wallet, Plus, Download, Filter, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertCircle, Clock, FileText, Building2
} from 'lucide-react';

export default function Financial() {
  const financial = useStore(s => s.financial);
  const insurances = useStore(s => s.insurances);
  const professionals = useStore(s => s.professionals);
  const [tab, setTab] = useState<'dashboard'|'lancamentos'|'convenios'|'repasses'>('dashboard');
  const [newOpen, setNewOpen] = useState(false);

  const totals = useMemo(() => {
    const receita = financial.filter(f => f.type === 'receita').reduce((a,b) => a+b.amount, 0);
    const despesa = financial.filter(f => f.type === 'despesa').reduce((a,b) => a+b.amount, 0);
    const receitaPaga = financial.filter(f => f.type === 'receita' && f.status === 'pago').reduce((a,b) => a+b.amount, 0);
    const despesaPaga = financial.filter(f => f.type === 'despesa' && f.status === 'pago').reduce((a,b) => a+b.amount, 0);
    const aReceber = financial.filter(f => f.type === 'receita' && f.status !== 'pago').reduce((a,b) => a+b.amount, 0);
    const aPagar = financial.filter(f => f.type === 'despesa' && f.status !== 'pago').reduce((a,b) => a+b.amount, 0);
    return { receita, despesa, receitaPaga, despesaPaga, aReceber, aPagar, saldo: receitaPaga - despesaPaga };
  }, [financial]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Financeiro" title="Gestão financeira" subtitle="Fluxo de caixa, convênios, repasses médicos e inadimplência em um só lugar.">
        <Button variant="secondary" size="sm" icon={<Download className="size-4" />}>Exportar</Button>
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setNewOpen(true)}>Novo lançamento</Button>
      </PageHeader>

      <div className="flex items-center gap-1 border-b border-ink-100 mb-6">
        {([['dashboard','Dashboard'],['lancamentos','Lançamentos'],['convenios','Convênios & TISS'],['repasses','Repasses médicos']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 h-11 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <FinCard icon={<TrendingUp className="size-5" />} label="Receita (pago)" value={brl(totals.receitaPaga)} tone="grass" />
            <FinCard icon={<TrendingDown className="size-5" />} label="Despesa (pago)" value={brl(totals.despesaPaga)} tone="flame" />
            <FinCard icon={<ArrowDownRight className="size-5" />} label="A receber" value={brl(totals.aReceber)} tone="honey" />
            <FinCard icon={<Wallet className="size-5" />} label="Saldo líquido" value={brl(totals.saldo)} tone="brand" big />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-8 p-6">
              <div className="flex items-center justify-between mb-4">
                <div><div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold">Fluxo de caixa</div><h3 className="font-display text-xl text-ink-800">Últimos movimentos</h3></div>
                <Button variant="ghost" size="sm" icon={<Filter className="size-4" />}>Filtrar</Button>
              </div>
              <div className="divide-y divide-ink-100">
                {financial.slice().reverse().slice(0, 12).map(f => (
                  <div key={f.id} className="py-3 flex items-center gap-4">
                    <div className={`size-9 rounded-xl grid place-items-center ${f.type === 'receita' ? 'bg-emerald-50 text-grass-600' : 'bg-rose-50 text-flame-600'}`}>
                      {f.type === 'receita' ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink-800 font-medium truncate">{f.description}</div>
                      <div className="text-xs text-ink-500">{fmtDate(f.date)} · {f.category}{f.method && ` · ${f.method}`}</div>
                    </div>
                    <div className={`font-mono font-semibold ${f.type === 'receita' ? 'text-grass-600' : 'text-flame-600'}`}>
                      {f.type === 'receita' ? '+' : '−'} {brl(f.amount)}
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                ))}
              </div>
            </Card>

            <div className="col-span-12 lg:col-span-4 space-y-4">
              <Card className="p-5">
                <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">A receber</div>
                <h4 className="font-display text-lg text-ink-800 mb-3">Convênios pendentes</h4>
                {financial.filter(f => f.type === 'receita' && f.status === 'pendente').map(f => (
                  <div key={f.id} className="flex items-center gap-2 py-2 border-b border-ink-100 last:border-0">
                    <FileText className="size-4 text-honey-500" />
                    <div className="flex-1 min-w-0"><div className="text-sm text-ink-800 truncate">{f.description}</div><div className="text-xs text-ink-500">{fmtDate(f.date)}</div></div>
                    <div className="text-sm font-mono text-honey-600">{brl(f.amount)}</div>
                  </div>
                ))}
              </Card>
              <Card className="p-5 bg-gradient-to-br from-flame-500 to-flame-600 text-white">
                <AlertCircle className="size-5 mb-2" />
                <div className="text-xs text-white/80">Inadimplência</div>
                <div className="font-display text-2xl">{brl(1240)}</div>
                <div className="text-xs text-white/80 mt-1">3 pacientes com cobranças atrasadas</div>
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === 'lancamentos' && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50"><tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Descrição</th>
              <th className="px-5 py-3">Categoria</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-ink-100">
              {financial.slice().reverse().map(f => (
                <tr key={f.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3 text-ink-600">{fmtDate(f.date)}</td>
                  <td className="px-5 py-3 text-ink-800">{f.description}</td>
                  <td className="px-5 py-3"><Badge tone="ink">{f.category}</Badge></td>
                  <td className="px-5 py-3"><Badge tone={f.type === 'receita' ? 'grass' : 'flame'}>{f.type}</Badge></td>
                  <td className="px-5 py-3 font-mono font-semibold">{brl(f.amount)}</td>
                  <td className="px-5 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-5 py-3">
                    {f.status !== 'pago' && <button onClick={() => actions.updateFinancial(f.id, { status: 'pago' })} className="text-xs text-brand-600 hover:text-brand-700">Marcar como pago</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'convenios' && (
        <div className="space-y-4">
          {insurances.map(i => (
            <Card key={i.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><Building2 className="size-5" /></div>
                  <div>
                    <div className="font-display text-lg text-ink-800">{i.name}</div>
                    <div className="text-sm text-ink-500">{i.cnpj} · Prazo de glosa: {i.deadline} dias</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">{i.plans.map(p => <Badge key={p} tone="brand">{p}</Badge>)}</div>
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon={<FileText className="size-4" />}>Gerar guia TISS</Button>
              </div>
              <div className="mt-4 pt-4 border-t border-ink-100">
                <div className="text-xs text-ink-500 mb-2">Tabela de procedimentos</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {i.procedures.map(p => (
                    <div key={p.code} className="p-3 rounded-lg bg-ink-50"><div className="text-xs text-ink-400 font-mono">{p.code}</div><div className="text-sm text-ink-700">{p.name}</div><div className="text-sm font-semibold text-ink-800">{brl(p.value)}</div></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'repasses' && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50"><tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3">Profissional</th>
              <th className="px-5 py-3">Especialidade</th>
              <th className="px-5 py-3">Atendimentos mês</th>
              <th className="px-5 py-3">Faturação</th>
              <th className="px-5 py-3">% Repasse</th>
              <th className="px-5 py-3">Valor repasse</th>
            </tr></thead>
            <tbody className="divide-y divide-ink-100">
              {professionals.map(p => {
                const n = 48 + Math.floor(Math.random()*30);
                const fat = n * 380;
                return (
                  <tr key={p.id}>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="size-8 rounded-full grid place-items-center text-white text-xs font-semibold" style={{backgroundColor:p.color}}>{p.name.split(' ').slice(0,2).map(n => n[0]).join('')}</div><span className="text-ink-800">{p.name}</span></div></td>
                    <td className="px-5 py-3"><Badge tone="brand">{p.specialty}</Badge></td>
                    <td className="px-5 py-3 text-ink-700">{n}</td>
                    <td className="px-5 py-3 font-mono text-ink-800">{brl(fat)}</td>
                    <td className="px-5 py-3 font-semibold text-ink-800">{p.repasse}%</td>
                    <td className="px-5 py-3 font-mono font-semibold text-grass-600">{brl(fat * p.repasse/100)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <NewFinancialModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

function FinCard({ icon, label, value, tone, big }:{ icon: React.ReactNode; label: string; value: string; tone: 'grass'|'flame'|'honey'|'brand'; big?: boolean }) {
  const bg = { grass: 'bg-emerald-50 text-grass-600', flame: 'bg-rose-50 text-flame-600', honey: 'bg-amber-50 text-honey-500', brand: 'bg-brand-50 text-brand-700' }[tone];
  return (
    <Card className={big ? 'p-5 bg-gradient-to-br from-brand-700 to-brand-900 text-white' : 'p-5'}>
      <div className="flex items-start justify-between">
        <div>
          <div className={big ? 'text-xs text-brand-100' : 'text-xs text-ink-500'}>{label}</div>
          <div className={big ? 'font-display text-[26px] mt-1' : 'font-display text-[24px] mt-1 text-ink-800'}>{value}</div>
        </div>
        <div className={big ? 'size-10 rounded-xl bg-white/10 grid place-items-center text-aqua-400' : `size-10 rounded-xl grid place-items-center ${bg}`}>{icon}</div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }:{ status:'pago'|'pendente'|'atrasado' }) {
  if (status === 'pago') return <Badge tone="grass"><CheckCircle2 className="size-3" /> Pago</Badge>;
  if (status === 'pendente') return <Badge tone="honey"><Clock className="size-3" /> Pendente</Badge>;
  return <Badge tone="flame"><AlertCircle className="size-3" /> Atrasado</Badge>;
}

function NewFinancialModal({ open, onClose }:{ open: boolean; onClose:()=>void }) {
  const [type, setType] = useState<'receita'|'despesa'>('receita');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Consultas');
  const [date, setDate] = useState(todayISO());
  function save() {
    if (!description) return;
    actions.addFinancial({ type, description, amount, category, date, status: 'pendente' });
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title="Novo lançamento" size="md">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo"><select value={type} onChange={e => setType(e.target.value as any)} className={selectCls}><option value="receita">Receita</option><option value="despesa">Despesa</option></select></Field>
        <Field label="Data"><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} /></Field>
        <div className="col-span-2"><Field label="Descrição"><input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} /></Field></div>
        <Field label="Categoria"><input value={category} onChange={e => setCategory(e.target.value)} className={inputCls} /></Field>
        <Field label="Valor (R$)"><input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value)||0)} className={inputCls} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-ink-100"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>
    </Modal>
  );
}
