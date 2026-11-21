import { useMemo } from 'react';
import { useStore } from '../lib/store';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { brl, todayISO, cls } from '../lib/utils';
import { STATUS_META } from '../lib/statuses';
import {
  Calendar, CheckCircle2, Clock, UserPlus, TrendingUp, TrendingDown, AlertTriangle,
  Activity, Users, Stethoscope, ArrowUpRight, Filter, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const appointments = useStore(s => s.appointments);
  const patients = useStore(s => s.patients);
  const financial = useStore(s => s.financial);
  const professionals = useStore(s => s.professionals);

  const today = todayISO();
  const todays = appointments.filter(a => a.date === today);

  const kpis = useMemo(() => {
    const confirmados = todays.filter(a => a.status === 'confirmado').length;
    const atendidos = todays.filter(a => a.status === 'atendido').length;
    const aguardando = todays.filter(a => a.status === 'aguardando' || a.status === 'em_atendimento').length;
    const faltas = todays.filter(a => a.status === 'falta').length;
    const cancelados = todays.filter(a => a.status === 'cancelado').length;
    const novosHoje = patients.filter(p => p.createdAt === today).length;
    const receitaDia = financial.filter(f => f.date === today && f.type === 'receita' && f.status === 'pago').reduce((a,b) => a+b.amount, 0);
    const receitaMes = financial.filter(f => f.type === 'receita' && f.status === 'pago').reduce((a,b) => a+b.amount, 0);
    const despesaMes = financial.filter(f => f.type === 'despesa' && f.status === 'pago').reduce((a,b) => a+b.amount, 0);
    const saldo = receitaMes - despesaMes;
    const ocupacao = Math.round((todays.filter(a => a.status !== 'cancelado').length / 26) * 100);
    return { confirmados, atendidos, aguardando, faltas, cancelados, novosHoje, receitaDia, receitaMes, despesaMes, saldo, ocupacao, totalHoje: todays.length };
  }, [todays, patients, financial]);

  // Last 7 days for chart
  const last7 = useMemo(() => {
    const days: { label:string; count:number; revenue:number }[] = [];
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const iso = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
      const count = appointments.filter(a => a.date === iso && a.status !== 'cancelado').length;
      const revenue = financial.filter(f => f.date === iso && f.type === 'receita' && f.status === 'pago').reduce((a,b) => a+b.amount, 0);
      days.push({ label: d.toLocaleDateString('pt-BR', { weekday:'short' }).slice(0,3), count, revenue });
    }
    return days;
  }, [appointments, financial]);

  const maxCount = Math.max(...last7.map(d => d.count), 1);

  // Specialty distribution
  const specStats = useMemo(() => {
    const map = new Map<string, number>();
    todays.forEach(a => {
      const p = professionals.find(pr => pr.id === a.professionalId);
      if (!p) return;
      map.set(p.specialty, (map.get(p.specialty) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a,b) => b[1] - a[1]);
  }, [todays, professionals]);

  const specTotal = specStats.reduce((a,b) => a+b[1], 0) || 1;

  const agendaHoje = todays
    .filter(a => a.status !== 'cancelado')
    .sort((a,b) => a.start.localeCompare(b.start));

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Visão geral"
        title="Bom dia, Dra. Helena"
        subtitle="Panorama clínico e financeiro em tempo real — baseado nos agendamentos, atendimentos e lançamentos do dia."
      >
        <Button variant="secondary" size="sm" icon={<Filter className="size-4" />}>Filtros</Button>
        <Button variant="secondary" size="sm" icon={<Download className="size-4" />}>Exportar</Button>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<Calendar className="size-5" />} label="Consultas hoje" value={kpis.totalHoje} sub={`${kpis.confirmados} confirmadas`} tone="brand" />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label="Atendidos" value={kpis.atendidos} sub={`${kpis.aguardando} na sala`} tone="grass" />
        <KpiCard icon={<AlertTriangle className="size-5" />} label="Faltas + cancelamentos" value={kpis.faltas + kpis.cancelados} sub={`${Math.round(((kpis.faltas)/(kpis.totalHoje||1))*100)}% taxa de falta`} tone="flame" />
        <KpiCard icon={<UserPlus className="size-5" />} label="Novos pacientes" value={kpis.novosHoje} sub="hoje" tone="aqua" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Chart + Finance */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">Atendimentos</div>
                <h3 className="font-display text-xl text-ink-800">Últimos 7 dias</h3>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-ink-500"><span className="size-2 rounded-sm bg-brand-500" /> Consultas</span>
                <span className="flex items-center gap-1.5 text-ink-500"><span className="size-2 rounded-sm bg-aqua-500" /> Receita</span>
              </div>
            </div>
            <div className="flex items-end gap-3 h-56">
              {last7.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    <div className="w-5 bg-brand-500 rounded-t-md relative group" style={{ height: `${(d.count/maxCount)*100}%`, minHeight: 4 }}>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-ink-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap transition-opacity">
                        {d.count} consultas
                      </div>
                    </div>
                    <div className="w-5 bg-aqua-500 rounded-t-md" style={{ height: `${Math.min((d.revenue/8000)*100, 100)}%`, minHeight: 4 }} />
                  </div>
                  <div className="text-[11px] text-ink-500 capitalize">{d.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Finance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-ink-500">Receita no mês</div>
                <TrendingUp className="size-4 text-grass-500" />
              </div>
              <div className="font-display text-[26px] text-ink-800 mt-1">{brl(kpis.receitaMes)}</div>
              <div className="text-xs text-grass-600 mt-1 flex items-center gap-1">+12,4% vs. mês anterior</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-ink-500">Despesas no mês</div>
                <TrendingDown className="size-4 text-flame-500" />
              </div>
              <div className="font-display text-[26px] text-ink-800 mt-1">{brl(kpis.despesaMes)}</div>
              <div className="text-xs text-flame-600 mt-1">+3,1% vs. mês anterior</div>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-brand-700 to-brand-900 text-white">
              <div className="flex items-center justify-between">
                <div className="text-xs text-brand-200">Saldo líquido</div>
                <Activity className="size-4 text-aqua-400" />
              </div>
              <div className="font-display text-[26px] mt-1">{brl(kpis.saldo)}</div>
              <div className="text-xs text-brand-200 mt-1">Receita de hoje: {brl(kpis.receitaDia)}</div>
            </Card>
          </div>

          {/* Pacientes do dia */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">Agenda do dia</div>
                <h3 className="font-display text-xl text-ink-800">Pacientes de hoje</h3>
              </div>
              <Link to="/agenda" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Ver agenda completa <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-ink-400 border-b border-ink-100">
                    <th className="py-2.5 font-medium">Horário</th>
                    <th className="py-2.5 font-medium">Paciente</th>
                    <th className="py-2.5 font-medium">Profissional</th>
                    <th className="py-2.5 font-medium">Procedimento</th>
                    <th className="py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {agendaHoje.slice(0, 8).map(a => {
                    const p = patients.find(x => x.id === a.patientId);
                    const pr = professionals.find(x => x.id === a.professionalId);
                    const st = STATUS_META[a.status];
                    return (
                      <tr key={a.id} className="hover:bg-ink-50/50 cursor-pointer">
                        <td className="py-3 font-mono text-ink-700">{a.start}</td>
                        <td className="py-3">
                          <div className="text-ink-800 font-medium">{p?.name}</div>
                          <div className="text-xs text-ink-400">{p?.insurance}</div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full" style={{backgroundColor: pr?.color}} />
                            <span className="text-ink-700">{pr?.name.split(' ').slice(0,3).join(' ')}</span>
                          </div>
                        </td>
                        <td className="py-3 text-ink-600">{a.procedure}</td>
                        <td className="py-3">
                          <span className={cls('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', st.bg, st.color)}>
                            <span className={cls('size-1.5 rounded-full', st.dot)} /> {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Occupancy donut */}
          <Card className="p-6">
            <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">Operação</div>
            <h3 className="font-display text-xl text-ink-800 mb-4">Taxa de ocupação</h3>
            <div className="flex items-center justify-center py-2">
              <div className="relative size-44">
                <svg className="-rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" strokeWidth="10" fill="none" className="stroke-ink-100" />
                  <circle cx="50" cy="50" r="42" strokeWidth="10" fill="none" strokeLinecap="round"
                    className="stroke-brand-500" strokeDasharray={`${(kpis.ocupacao/100)*264} 264`} />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="font-display text-4xl text-ink-800">{kpis.ocupacao}%</div>
                    <div className="text-xs text-ink-500">26 slots disponíveis</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 text-center text-xs">
              <div><div className="text-ink-800 font-semibold">{kpis.confirmados}</div><div className="text-ink-400">Confirmadas</div></div>
              <div><div className="text-ink-800 font-semibold">{kpis.aguardando}</div><div className="text-ink-400">Em espera</div></div>
              <div><div className="text-ink-800 font-semibold">{kpis.atendidos}</div><div className="text-ink-400">Atendidos</div></div>
            </div>
          </Card>

          {/* By specialty */}
          <Card className="p-6">
            <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">Distribuição</div>
            <h3 className="font-display text-xl text-ink-800 mb-4">Por especialidade</h3>
            <div className="space-y-3">
              {specStats.map(([spec, n]) => (
                <div key={spec}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink-700 font-medium">{spec}</span>
                    <span className="text-ink-500">{n} · {Math.round((n/specTotal)*100)}%</span>
                  </div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-aqua-500 rounded-full" style={{ width: `${(n/specTotal)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top docs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-1">Produção</div>
                <h3 className="font-display text-xl text-ink-800">Médicos no mês</h3>
              </div>
              <Stethoscope className="size-5 text-brand-500" />
            </div>
            <div className="space-y-3">
              {professionals.slice(0,4).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="size-9 rounded-full grid place-items-center text-white text-xs font-semibold" style={{backgroundColor: p.color}}>
                    {p.name.split(' ').slice(0,2).map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-800 truncate">{p.name}</div>
                    <div className="text-xs text-ink-400">{p.specialty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-ink-800">{brl(8000 + Math.random()*20000)}</div>
                    <Badge tone={i === 0 ? 'grass' : 'ink'}>{48 + Math.floor(Math.random()*40)} atend.</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, tone }:{ icon: React.ReactNode; label: string; value: number | string; sub: string; tone: 'brand'|'grass'|'flame'|'aqua' }) {
  const bg = {
    brand: 'bg-brand-50 text-brand-700',
    grass: 'bg-emerald-50 text-grass-600',
    flame: 'bg-rose-50 text-flame-600',
    aqua: 'bg-cyan-50 text-aqua-500',
  }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-ink-500">{label}</div>
          <div className="font-display text-[32px] text-ink-900 mt-0.5 leading-none">{value}</div>
          <div className="text-xs text-ink-500 mt-2">{sub}</div>
        </div>
        <div className={cls('size-10 rounded-xl grid place-items-center', bg)}>{icon}</div>
      </div>
    </Card>
  );
}
