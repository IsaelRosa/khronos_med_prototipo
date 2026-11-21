import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointments as appointmentsAPI } from '../lib/api';
import type { AppointmentResponse } from '../lib/api';
import { STATUS_META } from '../lib/statuses';
import { fmtDate } from '../lib/utils';
import { Badge, Card } from './ui';

export default function PatientAppointments({ patientId, refreshKey = 0, showScheduleAction = true }:{
  patientId: string; refreshKey?: number; showScheduleAction?: boolean;
}) {
  const [result, setResult] = useState<{ key: string; appointments: AppointmentResponse[]; error: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const key = `${patientId}:${refreshKey}:${retry}`;

  useEffect(() => {
    let active = true;
    appointmentsAPI.listByPatient(patientId).then(appointments => {
      if (!active) return;
      if (appointments.some(a => a.patient_id !== patientId)) {
        throw new Error('A API retornou um agendamento de outro paciente.');
      }
      setResult({ key, appointments, error: '' });
    }).catch((error: unknown) => {
      if (!active) return;
      console.error('Erro ao carregar agendamentos do paciente:', error);
      setResult({ key, appointments: [], error: error instanceof Error ? error.message : 'Erro ao carregar agendamentos.' });
    });
    return () => { active = false; };
  }, [patientId, key]);

  const loaded = result?.key === key;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-display text-lg text-ink-800">Agendamentos do paciente</h3>
        {showScheduleAction && <Link className="text-sm font-medium text-brand-700 hover:underline" to={`/agenda?patientId=${encodeURIComponent(patientId)}`}>Agendar para este paciente</Link>}
      </div>
      {!loaded ? <p className="text-sm text-ink-500">Carregando agendamentos...</p>
        : result.error ? <p className="text-sm text-flame-600">{result.error} <button className="underline" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></p>
        : result.appointments.length === 0 ? <p className="text-sm text-ink-500">Nenhum agendamento encontrado para este paciente. Agende uma consulta para iniciar o atendimento.</p>
        : <div className="space-y-2">
          {result.appointments.map(appointment => {
            const status = appointment.status === 'concluido' ? 'atendido' : appointment.status === 'nao_compareceu' ? 'falta' : appointment.status;
            const meta = STATUS_META[status];
            const canStart = ['agendado', 'confirmado', 'aguardando', 'em_atendimento'].includes(status);
            return (
              <div key={appointment.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-ink-100">
                <div className="flex-1 min-w-48">
                  <div className="text-sm font-medium text-ink-800">{fmtDate(appointment.date.slice(0, 10))} · {appointment.start_time.slice(0, 5)}</div>
                  <div className="text-xs text-ink-500">{appointment.professional_name || 'Profissional não informado'}{appointment.procedure ? ` · ${appointment.procedure}` : ''}</div>
                </div>
                <Badge tone="ink">{meta?.label ?? status}</Badge>
                {canStart && <Link className="text-sm font-medium text-brand-700 hover:underline" to={`/atendimento/${encodeURIComponent(appointment.id)}`}>Iniciar ou continuar atendimento</Link>}
              </div>
            );
          })}
        </div>}
    </Card>
  );
}
