import { useStore } from '../lib/store';
import { Card, PageHeader, Button, Badge } from '../components/ui';
import { brl, todayISO } from '../lib/utils';
import { Download, FileSpreadsheet, FileText, BarChart3, TrendingUp, Users, Activity, Calendar, AlertTriangle } from 'lucide-react';

const reports = [
  { title:'Atendimentos por período', desc:'Volume diário, semanal e mensal por médico', icon: Calendar, tone:'brand' },
  { title:'Produção médica', desc:'Faturação, repasses, atendimentos', icon: TrendingUp, tone:'grass' },
  { title:'Pacientes', desc:'Novos vs. recorrentes, perfil demográfico', icon: Users, tone:'aqua' },
  { title:'Faltas e cancelamentos', desc:'Taxa por médico e período', icon: AlertTriangle, tone:'flame' },
  { title:'Fluxo financeiro', desc:'Receitas, despesas, inadimplência', icon: Activity, tone:'honey' },
  { title:'Desempenho de convênios', desc:'Guias, glosas, prazos de pagamento', icon: BarChart3, tone:'violet' },
];

export default function Reports() {
  const appointments = useStore(s => s.appointments);
  const financial = useStore(s => s.financial);
  const patients = useStore(s => s.patients);
  const today = todayISO();
  const todays = appointments.filter(a => a.date === today);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Relatórios" title="Centro de análises" subtitle="Exporte em PDF ou Excel. Filtros por período, unidade, médico e especialidade." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <QuickStat label="Consultas hoje" value={todays.length} />
        <QuickStat label="Receita do dia" value={brl(financial.filter(f => f.date === today && f.type === 'receita' && f.status === 'pago').reduce((a,b) => a+b.amount, 0))} />
        <QuickStat label="Pacientes ativos" value={patients.length} />
        <QuickStat label="Taxa de falta" value={`${Math.round((todays.filter(a => a.status === 'falta').length / (todays.length||1))*100)}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <Card key={r.title} className="p-5 group hover:shadow-md transition cursor-pointer">
            <div className={`size-10 rounded-xl grid place-items-center mb-3 bg-${r.tone}-50`}><r.icon className={`size-5 text-${r.tone}-600`} /></div>
            <h3 className="font-display text-lg text-ink-800">{r.title}</h3>
            <p className="text-sm text-ink-500 mt-1 mb-4">{r.desc}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={<FileText className="size-3.5" />}>PDF</Button>
              <Button size="sm" variant="ghost" icon={<FileSpreadsheet className="size-3.5" />}>Excel</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div><div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold">Análise rápida</div><h3 className="font-display text-xl text-ink-800">Receita por categoria</h3></div>
          <Button size="sm" variant="secondary" icon={<Download className="size-4" />}>Exportar tudo</Button>
        </div>
        <ReceitaChart />
      </Card>
    </div>
  );
}

function QuickStat({ label, value }:{ label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="font-display text-[26px] text-ink-800 mt-1">{value}</div>
    </Card>
  );
}

function ReceitaChart() {
  const financial = useStore(s => s.financial);
  const map = new Map<string, number>();
  financial.filter(f => f.type === 'receita').forEach(f => map.set(f.category, (map.get(f.category)||0) + f.amount));
  const entries = Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
  const total = entries.reduce((a,b) => a+b[1], 0) || 1;
  const colors = ['bg-brand-500','bg-aqua-500','bg-grass-500','bg-honey-500','bg-flame-500','bg-violet-500'];
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {entries.map(([cat, v], i) => <div key={cat} className={colors[i%colors.length]} style={{ width: `${(v/total)*100}%` }} title={`${cat}: ${brl(v)}`} />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {entries.map(([cat, v], i) => (
          <div key={cat} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${colors[i%colors.length]}`} />
            <div className="flex-1 min-w-0"><div className="text-sm text-ink-700 truncate">{cat}</div><div className="text-xs text-ink-500">{Math.round((v/total)*100)}% · {brl(v)}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
