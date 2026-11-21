import { useState } from 'react';
import { Card, PageHeader, Button, Badge, Field, inputCls, textareaCls, selectCls } from '../components/ui';
import { MessageSquare, Send, Mail, Phone, CheckCircle2, Clock, Settings as SettingsIcon, Edit3 } from 'lucide-react';

const templates = [
  { id:'t1', name:'Confirmação de agendamento', channel:'whatsapp', enabled: true, text: 'Olá {paciente}! Confirmamos sua consulta com {medico} em {data} às {hora}. Responda SIM para confirmar.' },
  { id:'t2', name:'Lembrete 24h antes', channel:'whatsapp', enabled: true, text: 'Lembrete carinhoso: sua consulta é amanhã ({data}) às {hora}. Esperamos você no Instituto Khronos.' },
  { id:'t3', name:'Confirmação por SMS', channel:'sms', enabled: true, text: 'Khronos: consulta em {data} {hora}. SIM confirma, NÃO cancela.' },
  { id:'t4', name:'Reagendamento', channel:'email', enabled: false, text: 'Precisamos reagendar sua consulta. Clique no link para escolher um novo horário: {link}' },
  { id:'t5', name:'Pós-consulta', channel:'whatsapp', enabled: true, text: 'Obrigado pela confiança! Avalie sua experiência em {link}.' },
  { id:'t6', name:'Retorno sugerido', channel:'email', enabled: true, text: 'Está próximo do seu retorno recomendado. Quer agendar? {link}' },
];

const logs = [
  { to:'Ana Silva', channel:'whatsapp', template:'Confirmação de agendamento', at:'09:42', status:'entregue' },
  { to:'João Souza', channel:'sms', template:'Lembrete 24h antes', at:'09:38', status:'entregue' },
  { to:'Beatriz Araújo', channel:'whatsapp', template:'Confirmação de agendamento', at:'09:12', status:'lido' },
  { to:'Pedro Lima', channel:'email', template:'Retorno sugerido', at:'08:50', status:'entregue' },
  { to:'Mariana Dias', channel:'whatsapp', template:'Pós-consulta', at:'08:12', status:'pendente' },
];

export default function Communication() {
  const [tab, setTab] = useState<'templates'|'campanhas'|'historico'>('templates');
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Comunicação" title="Mensagens e campanhas" subtitle="Integração preparada para WhatsApp Business API, SMS e e-mail transacional." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<MessageSquare className="size-5" />} label="WhatsApp enviados" value="148" sub="hoje" tone="grass" />
        <StatCard icon={<Mail className="size-5" />} label="E-mails" value="62" sub="hoje" tone="brand" />
        <StatCard icon={<Phone className="size-5" />} label="SMS" value="34" sub="hoje" tone="aqua" />
        <StatCard icon={<CheckCircle2 className="size-5" />} label="Taxa de confirmação" value="91%" sub="+4,2% vs. mês passado" tone="honey" />
      </div>

      <div className="flex items-center gap-1 border-b border-ink-100 mb-6">
        {([['templates','Templates'],['campanhas','Campanhas'],['historico','Histórico de envios']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 h-11 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold text-ink-800">{t.name}</span>
                    <Badge tone={t.channel === 'whatsapp' ? 'grass' : t.channel === 'email' ? 'brand' : 'aqua'}>{t.channel}</Badge>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={t.enabled} className="sr-only peer" />
                  <div className="w-10 h-5 bg-ink-200 rounded-full peer-checked:bg-brand-500 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:size-4 peer-checked:after:translate-x-5 after:transition-transform"></div>
                </label>
              </div>
              <div className="p-3 rounded-lg bg-ink-50 text-sm text-ink-700 italic">“{t.text}”</div>
              <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" icon={<Edit3 className="size-3.5" />}>Editar</Button><Button size="sm" variant="ghost" icon={<Send className="size-3.5" />}>Testar envio</Button></div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'campanhas' && (
        <Card className="p-6">
          <h3 className="font-display text-lg text-ink-800 mb-4">Nova campanha</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome da campanha"><input className={inputCls} placeholder="Ex: Campanha de checkup anual" /></Field>
            <Field label="Canal"><select className={selectCls}><option>WhatsApp</option><option>E-mail</option><option>SMS</option></select></Field>
            <Field label="Público-alvo"><select className={selectCls}><option>Pacientes sem consulta há 6 meses</option><option>Pacientes com retorno agendado</option><option>Anivariantes do mês</option><option>Pacientes de convênio específico</option></select></Field>
            <Field label="Agendar para"><input type="datetime-local" className={inputCls} /></Field>
            <div className="col-span-2"><Field label="Mensagem"><textarea className={textareaCls} rows={4} placeholder="Olá {paciente}! Faz 6 meses desde sua última consulta. Que tal agendar um checkup? {link_agendamento}" /></Field></div>
          </div>
          <div className="flex justify-end gap-2 mt-4"><Button variant="secondary">Rascunho</Button><Button icon={<Send className="size-4" />}>Agendar envio</Button></div>
        </Card>
      )}

      {tab === 'historico' && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50"><tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3">Destinatário</th>
              <th className="px-5 py-3">Canal</th>
              <th className="px-5 py-3">Template</th>
              <th className="px-5 py-3">Horário</th>
              <th className="px-5 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-ink-100">
              {logs.map((l,i) => (
                <tr key={i}>
                  <td className="px-5 py-3 text-ink-800">{l.to}</td>
                  <td className="px-5 py-3"><Badge tone={l.channel === 'whatsapp' ? 'grass' : l.channel === 'email' ? 'brand' : 'aqua'}>{l.channel}</Badge></td>
                  <td className="px-5 py-3 text-ink-700">{l.template}</td>
                  <td className="px-5 py-3 text-ink-500 font-mono text-xs">{l.at}</td>
                  <td className="px-5 py-3"><Badge tone={l.status === 'entregue' || l.status === 'lido' ? 'grass' : 'honey'}>{l.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }:{ icon: React.ReactNode; label: string; value: string; sub: string; tone:'brand'|'grass'|'flame'|'aqua'|'honey' }) {
  const bg = { brand:'bg-brand-50 text-brand-700', grass:'bg-emerald-50 text-grass-600', flame:'bg-rose-50 text-flame-600', aqua:'bg-cyan-50 text-aqua-500', honey:'bg-amber-50 text-honey-500' }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-ink-500">{label}</div>
          <div className="font-display text-[24px] text-ink-800 mt-1">{value}</div>
          <div className="text-xs text-ink-500 mt-1">{sub}</div>
        </div>
        <div className={`size-10 rounded-xl grid place-items-center ${bg}`}>{icon}</div>
      </div>
    </Card>
  );
}
