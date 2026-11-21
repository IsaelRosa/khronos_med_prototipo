import { useStore } from '../lib/store';
import { Card, PageHeader, Badge, Button, Field, inputCls, textareaCls } from '../components/ui';
import { Shield, Zap, FileText, Globe, Bell, CreditCard, Link2, Copy } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const clinic = useStore(s => s.clinic);
  const [tab, setTab] = useState<'clínica'|'integrações'|'segurança'|'assinatura'|'ia'>('clínica');
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Configurações" title="Preferências da plataforma" subtitle="Identidade, integrações, segurança, LGPD e plano de assinatura." />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <Card className="p-2">
            {(['clínica','integrações','segurança','assinatura','ia'] as const).map(k => (
              <button key={k} onClick={() => setTab(k)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm capitalize ${tab === k ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-600 hover:bg-ink-50'}`}>{k}</button>
            ))}
          </Card>
        </div>
        <div className="col-span-12 md:col-span-9 space-y-4">
          {tab === 'clínica' && (
            <Card className="p-6">
              <h3 className="font-display text-lg text-ink-800 mb-4">Dados da clínica</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Razão social"><input defaultValue={clinic.name} className={inputCls} /></Field>
                <Field label="CNPJ"><input defaultValue={clinic.cnpj} className={inputCls} /></Field>
                <Field label="Domínio de agendamento"><input defaultValue={`agendar.khronos.med.br/${clinic.slug}`} className={inputCls} /></Field>
                <Field label="Timezone"><input defaultValue="America/Sao_Paulo" className={inputCls} /></Field>
                <div className="col-span-2"><Field label="Descrição pública"><textarea className={textareaCls} rows={3} defaultValue="Clínica multiespecialidade focada em saúde preventiva, com atendimento humanizado em São Paulo." /></Field></div>
              </div>
            </Card>
          )}
          {tab === 'integrações' && (
            <>
              <IntegrationCard icon={<Zap className="size-5" />} name="WhatsApp Business API" status="conectado" desc="Envio de confirmações, lembretes e pós-consulta." />
              <IntegrationCard icon={<FileText className="size-5" />} name="Certificado digital ICP-Brasil" status="pendente" desc="Necessário para assinatura digital de receitas e laudos com validade jurídica." />
              <IntegrationCard icon={<Globe className="size-5" />} name="TISS / SAVI (Unimed)" status="homologação" desc="Troca de informações em saúde suplementar. Guias e faturamento." />
              <IntegrationCard icon={<Zap className="size-5" />} name="Khronos Live Video" status="conectado" desc="Teleconsulta WebRTC criptografada." />
            </>
          )}
          {tab === 'segurança' && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4"><Shield className="size-6 text-brand-600" /><div><div className="font-display text-lg text-ink-800">Segurança & LGPD</div><div className="text-sm text-ink-500">Criptografia, auditoria e privacidade por padrão.</div></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['Criptografia em trânsito', 'TLS 1.3', true],
                  ['Dados em repouso', 'AES-256', true],
                  ['MFA obrigatório', 'Via app autenticador', true],
                  ['Auditoria imutável', 'Hash encadeado', true],
                  ['Backups diários', 'Criptografados', true],
                  ['Retenção de dados', '20 anos (CFM)', true],
                  ['Consentimento LGPD', 'Trilha completa', true],
                  ['Política de senhas', 'Mín. 12 chars, rotação 90d', true],
                ].map(([label, val, on]) => (
                  <div key={label as string} className="p-3 rounded-lg bg-ink-50 flex items-center justify-between">
                    <div><div className="text-sm text-ink-800">{label}</div><div className="text-xs text-ink-500">{val}</div></div>
                    {on ? <Badge tone="grass">Ativo</Badge> : <Badge tone="ink">Inativo</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {tab === 'assinatura' && (
            <Card className="p-6 bg-gradient-to-br from-brand-700 to-brand-900 text-white">
              <div className="flex items-start justify-between"><div><div className="text-xs text-brand-100 uppercase tracking-widest">Plano atual</div><div className="font-display text-3xl mt-1">Profissional</div><div className="text-sm text-brand-200 mt-1">Até 15 profissionais · 2 unidades · Agendamento online</div></div><Badge tone="grass">Ativo</Badge></div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div><div className="font-display text-2xl">6/15</div><div className="text-xs text-brand-200">Profissionais</div></div>
                <div><div className="font-display text-2xl">2/2</div><div className="text-xs text-brand-200">Unidades</div></div>
                <div><div className="font-display text-2xl">48/120</div><div className="text-xs text-brand-200">Pacientes (dia)</div></div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <div><div className="text-sm">Próxima cobrança</div><div className="font-semibold">15/12/2026 · R$ 1.890,00/mês</div></div>
                <div className="flex gap-2"><Button variant="secondary">Mudar plano</Button><Button variant="success" icon={<CreditCard className="size-4" />}>Gerenciar pagamento</Button></div>
              </div>
            </Card>
          )}
          {tab === 'ia' && (
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4"><div className="size-10 rounded-xl bg-gradient-to-br from-brand-500 to-aqua-500 grid place-items-center text-white"><Zap className="size-5" /></div><div><div className="font-display text-lg text-ink-800">IA de apoio clínico</div><div className="text-sm text-ink-500">Transcrição consentida, estruturação SOAP e sumários. <strong>Sempre com revisão médica antes de salvar.</strong></div></div></div>
              <div className="space-y-3">
                {[
                  ['Transcrição de consulta', 'Gravação com consentimento explícito. Áudio descartado após transcrição.', true],
                  ['Estruturação SOAP automática', 'Prepara campos baseado na transcrição. Revisão obrigatória.', true],
                  ['Resumo de evolução', 'Sumário inteligente do histórico do paciente.', false],
                  ['Alerta de campos vazios', 'Checa consistência antes da assinatura.', true],
                  ['Análise de indicadores', 'Insights sobre faltas, ocupação, receita.', true],
                ].map(([label, desc, on]) => (
                  <div key={label as string} className="flex items-center justify-between p-3 rounded-lg bg-ink-50">
                    <div><div className="text-sm font-semibold text-ink-800">{label}</div><div className="text-xs text-ink-500">{desc}</div></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={!!on} className="sr-only peer" />
                      <div className="w-10 h-5 bg-ink-200 rounded-full peer-checked:bg-brand-500 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:size-4 peer-checked:after:translate-x-5 after:transition-transform"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ icon, name, status, desc }:{ icon: React.ReactNode; name: string; status: 'conectado'|'pendente'|'homologação'; desc: string }) {
  const map = { conectado: 'grass', pendente: 'honey', 'homologação':'brand' } as const;
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="size-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">{icon}</div>
      <div className="flex-1"><div className="flex items-center gap-2"><span className="font-semibold text-ink-800">{name}</span><Badge tone={map[status]}>{status}</Badge></div><div className="text-sm text-ink-500">{desc}</div></div>
      <Button size="sm" variant="secondary">Configurar</Button>
    </Card>
  );
}
