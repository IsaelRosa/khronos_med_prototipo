import { useStore } from '../lib/store';
import { Card, PageHeader, Button, Badge } from '../components/ui';
import { Video, Clock, Play, Copy, Shield, Globe } from 'lucide-react';
import { fmtDate, todayISO } from '../lib/utils';
import { useState, useMemo } from 'react';

export default function Telehealth() {
  const appts = useStore(s => s.appointments);
  const patients = useStore(s => s.patients);
  const professionals = useStore(s => s.professionals);
  const [inRoom, setInRoom] = useState<string | null>(null);

  // Memoize filtered appointments to prevent infinite loops
  const telehealthAppts = useMemo(() => appts.filter(a => a.type === 'teleconsulta'), [appts]);

  const activeRoom = inRoom ? telehealthAppts.find(a => a.id === inRoom) : null;
  const activePatient = activeRoom ? patients.find(p => p.id === activeRoom.patientId) : null;

  if (activeRoom && activePatient) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-12 gap-6 h-[80vh]">
          <Card className="col-span-12 lg:col-span-9 p-0 overflow-hidden relative bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900">
            <div className="absolute inset-0 grid place-items-center text-white">
              <div className="text-center">
                <div className="size-32 rounded-full bg-white/10 grid place-items-center mx-auto mb-4 ring-4 ring-white/20">
                  <div className="size-24 rounded-full bg-gradient-to-br from-brand-400 to-aqua-500 grid place-items-center font-display text-3xl">
                    {activePatient.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                  </div>
                </div>
                <div className="font-display text-2xl">{activePatient.name}</div>
                <div className="text-sm text-brand-200 mt-1">Conexão segura · criptografia ponta a ponta</div>
              </div>
            </div>
            {/* Self preview */}
            <div className="absolute bottom-6 right-6 w-48 h-32 rounded-xl bg-black/50 ring-2 ring-white/20 grid place-items-center text-white text-xs">
              <div>Sua câmera (preview)</div>
            </div>
            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-2 ring-1 ring-white/10">
              <button className="size-12 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20">🎤</button>
              <button className="size-12 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20">📹</button>
              <button className="size-12 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20">💬</button>
              <button onClick={() => setInRoom(null)} className="px-5 h-12 rounded-full bg-flame-500 text-white font-semibold hover:bg-flame-600">Encerrar</button>
            </div>
          </Card>
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="p-4">
              <div className="text-xs text-ink-500">Paciente em consulta</div>
              <div className="font-display text-lg text-ink-800">{activePatient.name}</div>
              <Badge tone="grass" className="mt-2"><Shield className="size-3" /> Sala segura</Badge>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500 mb-2">Chat</div>
              <div className="space-y-2 text-sm">
                <div className="p-2 rounded-lg bg-ink-50 text-ink-700">Boa tarde, Doutora!</div>
                <div className="p-2 rounded-lg bg-brand-500 text-white ml-6">Boa tarde, {activePatient.name.split(' ')[0]}. Como está se sentindo hoje?</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Teleconsulta" title="Atendimento remoto" subtitle="Salas virtuais seguras, controle de entrada e registro automático no prontuário." />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8 p-6">
          <h3 className="font-display text-lg text-ink-800 mb-4">Salas agendadas</h3>
          <div className="space-y-3">
            {telehealthAppts.length === 0 && <div className="text-sm text-ink-500 py-8 text-center">Nenhuma teleconsulta agendada no momento.</div>}
            {telehealthAppts.map(a => {
              const pt = patients.find(p => p.id === a.patientId);
              const pr = professionals.find(p => p.id === a.professionalId);
              const isToday = a.date === todayISO();
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-ink-100">
                  <div className="size-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><Video className="size-5" /></div>
                  <div className="flex-1">
                    <div className="font-medium text-ink-800">{pt?.name}</div>
                    <div className="text-xs text-ink-500">{pr?.name} · {fmtDate(a.date)} · {a.start}</div>
                    <div className="text-xs text-ink-400 font-mono mt-1 flex items-center gap-1"><Globe className="size-3" /> {a.teleUrl || `https://meet.khronos.med.br/${a.id}`}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" icon={<Copy className="size-4" />}>Copiar link</Button>
                    <Button size="sm" icon={<Play className="size-4" />} onClick={() => setInRoom(a.id)} disabled={!isToday}>Entrar</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="p-6 bg-gradient-to-br from-brand-700 to-brand-900 text-white">
            <Video className="size-6 text-aqua-400 mb-3" />
            <h4 className="font-display text-xl mb-1">Infraestrutura segura</h4>
            <p className="text-sm text-brand-200 mb-4">Khronos Live com WebRTC e criptografia DTLS-SRTP. Gravações com consentimento explícito do paciente.</p>
            <ul className="space-y-1.5 text-sm text-brand-100">
              <li className="flex items-center gap-2"><Shield className="size-4 text-aqua-400" /> LGPD + CFM 2.314/22</li>
              <li className="flex items-center gap-2"><Clock className="size-4 text-aqua-400" /> Registro automático no prontuário</li>
              <li className="flex items-center gap-2"><Globe className="size-4 text-aqua-400" /> Acesso por link único</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
