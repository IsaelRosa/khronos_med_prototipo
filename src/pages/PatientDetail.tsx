import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import { Badge, Card } from '../components/ui';
import PatientAppointments from '../components/PatientAppointments';
import { patients as patientsAPI } from '../lib/api';
import type { PatientResponse } from '../lib/api';
import { age, fmtDate, initials } from '../lib/utils';

export default function PatientDetail() {
  const { id } = useParams();
  const [result, setResult] = useState<{ key: string; patient: PatientResponse | null; error: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const key = `${id}:${retry}`;

  useEffect(() => {
    if (!id) return;
    let active = true;
    patientsAPI.getById(id).then(patient => {
      if (active) setResult({ key, patient, error: '' });
    }).catch((error: unknown) => {
      if (!active) return;
      console.error('Erro ao carregar paciente:', error);
      setResult({ key, patient: null, error: error instanceof Error ? error.message : 'Erro ao carregar paciente.' });
    });
    return () => { active = false; };
  }, [id, key]);

  const patient = result?.key === key ? result.patient : null;
  const error = result?.key === key ? result.error : '';
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <Link to="/pacientes" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft className="size-4" /> Voltar para pacientes
      </Link>
      {error ? (
        <Card className="p-5 text-flame-600">{error} <button className="underline" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></Card>
      ) : !patient ? (
        <Card className="p-5">Carregando paciente...</Card>
      ) : (
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex flex-wrap items-start gap-5">
              <div className="size-16 rounded-2xl bg-brand-500 grid place-items-center text-white text-xl font-display">{initials(patient.name)}</div>
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-[28px] text-ink-900">{patient.name}</h1>
                  {patient.code && <Badge tone="brand">{patient.code}</Badge>}
                </div>
                <p className="text-sm text-ink-500">CPF: {patient.cpf}</p>
                <p className="text-sm text-ink-500 mt-1">
                  {patient.birth ? `${age(patient.birth)} anos · ${fmtDate(patient.birth.slice(0, 10))}` : 'Nascimento não informado'}
                  {' · '}{patient.sex === 'F' ? 'Feminino' : patient.sex === 'M' ? 'Masculino' : patient.sex === 'O' ? 'Outro' : 'Sexo não informado'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm font-medium text-brand-700">
                <Link to={`/prontuarios?patientId=${encodeURIComponent(patient.id)}`} className="flex items-center gap-1 hover:underline"><FileText className="size-4" /> Ver notas</Link>
                <Link to={`/agenda?patientId=${encodeURIComponent(patient.id)}`} className="flex items-center gap-1 hover:underline"><Calendar className="size-4" /> Agendar</Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm mt-5 text-ink-600">
              <div><strong>Telefone:</strong> {patient.phone || 'Não informado'}</div>
              <div><strong>WhatsApp:</strong> {patient.whatsapp || 'Não informado'}</div>
              <div><strong>E-mail:</strong> {patient.email || 'Não informado'}</div>
              <div><strong>Endereço:</strong> {patient.address || 'Não informado'}</div>
              <div><strong>Convênio:</strong> {patient.insurance || 'Não informado'}</div>
              <div><strong>Contato de emergência:</strong> {patient.emergency_contact || 'Não informado'}</div>
            </div>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold text-ink-800 mb-2">Alergias registradas</h2>
              <p className="text-sm text-ink-600">{patient.allergies?.length ? patient.allergies.join(', ') : 'Não informadas'}</p>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold text-ink-800 mb-2">Medicações registradas</h2>
              <p className="text-sm text-ink-600">{patient.medications?.length ? patient.medications.join(', ') : 'Não informadas'}</p>
            </Card>
          </div>
          <PatientAppointments patientId={patient.id} />
          <Card className="p-5 text-sm text-ink-500">Prescrições, exames e financeiro ainda não estão integrados aos dados desta tela.</Card>
        </div>
      )}
    </div>
  );
}
