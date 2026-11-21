import { useState, useMemo, useEffect } from 'react';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { fmtTimestampDate } from '../lib/utils';
import { FileText, Shield, Search, Filter, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { patients as patientsAPI, PatientResponse, soap as soapAPI, SOAPResponse } from '../lib/api';
import PatientAppointments from '../components/PatientAppointments';

export default function Records() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const [notesResult, setNotesResult] = useState<{ patientId: string; notes: SOAPResponse[] } | null>(null);
  const [notesError, setNotesError] = useState<{ patientId: string; message: string } | null>(null);
  const [patientsResult, setPatientsResult] = useState<{ key: number; error: string } | null>(null);
  const [patientsRefresh, setPatientsRefresh] = useState(0);
  const [q, setQ] = useState('');
  const [view, setView] = useState<'notas' | 'pacientes'>(patientId ? 'notas' : 'pacientes');
  const [notesRefresh, setNotesRefresh] = useState(0);
  const notes = useMemo(() => notesResult?.patientId === patientId ? notesResult.notes : [], [notesResult, patientId]);
  const loading = patientsResult?.key !== patientsRefresh;
  const error = patientsResult?.key === patientsRefresh ? patientsResult.error : '';
  const selectedPatient = patients.find(p => p.id === patientId);

  useEffect(() => {
    let active = true;
    patientsAPI.list().then(result => {
      if (!active) return;
      setPatients(result);
      setPatientsResult({ key: patientsRefresh, error: '' });
    }).catch((err: unknown) => {
      if (!active) return;
      console.error('Erro ao carregar pacientes:', err);
      setPatientsResult({ key: patientsRefresh, error: err instanceof Error ? err.message : 'Erro ao carregar dados' });
    });
    return () => { active = false; };
  }, [patientsRefresh]);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    soapAPI.listByPatient(patientId).then(result => {
      if (active) {
        setNotesResult({ patientId, notes: result });
        setNotesError(null);
      }
    }).catch((err: unknown) => {
      if (!active) return;
      console.error('Erro ao carregar notas:', err);
      setNotesResult(null);
      setNotesError({ patientId, message: err instanceof Error ? err.message : 'Erro ao carregar notas.' });
    });
    return () => { active = false; };
  }, [patientId, notesRefresh]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (!q) return true;
      return p.name.toLowerCase().includes(q.toLowerCase()) || p.cpf?.includes(q) || p.code?.includes(q);
    });
  }, [q, patients]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (!q) return true;
      const p = patients.find(pt => pt.id === n.patient_id);
      return p?.name.toLowerCase().includes(q.toLowerCase()) || n.diagnostico?.toLowerCase().includes(q.toLowerCase());
    });
  }, [q, notes, patients]);

  const getPatientNotes = (patientId: string) => {
    return notes.filter(n => n.patient_id === patientId);
  };

  const handleViewPatientNotes = (id: string) => {
    setSearchParams({ patientId: id });
    setView('notas');
    setQ('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Prontuários" title="Prontuário eletrônico" subtitle="Visualize dados completos dos pacientes, histórico médico e notas SOAP estruturadas.">
        <Button variant="secondary" size="sm" icon={<Filter className="size-4" />}>Filtros</Button>
      </PageHeader>

      {/* View Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setView('pacientes')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            view === 'pacientes'
              ? 'bg-brand-100 text-brand-700'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
          }`}
        >
          Pacientes
        </button>
        <button
          onClick={() => setView('notas')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            view === 'notas'
              ? 'bg-brand-100 text-brand-700'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
          }`}
        >
          Notas SOAP
        </button>
      </div>

      {error && (
        <Card className="p-4 mb-4 flex items-center gap-3 bg-red-50 border border-red-200">
          <AlertCircle className="size-5 text-red-500" />
          <div>
            <div className="font-medium text-red-900">{error}</div>
            <button onClick={() => setPatientsRefresh(n => n + 1)} className="text-xs text-red-700 hover:text-red-800 mt-1">Tentar novamente</button>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="p-3 mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder={view === 'pacientes' ? 'Buscar por nome, CPF ou código...' : 'Buscar por paciente, CID ou profissional...'}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-ink-50 border border-ink-100 text-sm focus:bg-white focus:border-brand-400 outline-none" 
          />
        </div>
      </Card>

      {/* VIEW: PACIENTES */}
      {view === 'pacientes' && (
        <div className="grid gap-4">
          {loading ? (
            <Card className="p-12 text-center">
              <Loader className="size-8 text-brand-500 animate-spin mx-auto mb-3" />
              <p className="text-ink-500">Carregando pacientes...</p>
            </Card>
          ) : error ? (
            <Card className="p-5 text-ink-500">Pacientes indisponíveis.</Card>
          ) : filteredPatients.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="size-10 mx-auto text-ink-300 mb-3" />
              <h3 className="font-display text-lg text-ink-800">Nenhum paciente encontrado</h3>
              <p className="text-sm text-ink-500 mb-4">Tente ajustar sua busca ou cadastre um novo paciente.</p>
            </Card>
          ) : (
            filteredPatients.map((p) => {
              const ptNotes = getPatientNotes(p.id);
              return (
                <Card key={p.id} className="p-5 hover:shadow-md hover:border-brand-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="size-12 rounded-xl bg-brand-50 text-brand-700 grid place-items-center font-semibold flex-shrink-0">
                        {p.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-lg text-ink-800">{p.name}</div>
                        <div className="text-sm text-ink-500 mt-1">
                          CPF: {p.cpf} • Código: {p.code}
                        </div>
                        <div className="text-sm text-ink-600 mt-2">
                          📧 {p.email} • 📱 {p.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="flex gap-2 flex-wrap justify-end">
                        {ptNotes.length > 0 && (
                          <Badge tone="grass">{ptNotes.length} notas</Badge>
                        )}
                        {p.insurance && (
                          <Badge tone="aqua">{p.insurance}</Badge>
                        )}
                      </div>
                      <button 
                        onClick={() => handleViewPatientNotes(p.id)}
                        className="text-brand-600 text-sm font-medium hover:text-brand-700 flex items-center gap-1"
                      >
                        Ver notas <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: NOTAS SOAP */}
      {view === 'notas' && (
        <div className="grid gap-4">
          {selectedPatient && !loading && !error && (
            <Card className="p-5">
              <h2 className="font-display text-lg text-ink-800">{selectedPatient.name}</h2>
              <Link to={`/pacientes/${encodeURIComponent(selectedPatient.id)}`} className="text-sm text-brand-700 hover:underline">Ver dados do paciente</Link>
            </Card>
          )}
          {!patientId ? (
            <Card className="p-12 text-center">
              <FileText className="size-10 mx-auto text-ink-300 mb-3" />
              <h3 className="font-display text-lg text-ink-800">Selecione um paciente</h3>
              <p className="text-sm text-ink-500 mb-4">Escolha um paciente para visualizar suas notas SOAP.</p>
              <Button onClick={() => setView('pacientes')}>Ver pacientes</Button>
            </Card>
          ) : error ? (
            <Card className="p-5 text-ink-500">Não foi possível identificar o paciente.</Card>
          ) : loading ? (
            <Card className="p-5">Carregando paciente...</Card>
          ) : !selectedPatient ? (
            <Card className="p-5 text-flame-600">Paciente não encontrado. <button className="underline" onClick={() => setView('pacientes')}>Ver pacientes</button></Card>
          ) : notesError?.patientId === patientId ? (
            <Card className="p-4 text-flame-600">{notesError.message} <button className="underline" onClick={() => setNotesRefresh(n => n + 1)}>Tentar novamente</button></Card>
          ) : notesResult?.patientId !== patientId ? (
            <Card className="p-12 text-center">
              <Loader className="size-8 text-brand-500 animate-spin mx-auto mb-3" />
              <p className="text-ink-500">Carregando notas...</p>
            </Card>
          ) : filteredNotes.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="size-10 mx-auto text-ink-300 mb-3" />
              <h3 className="font-display text-lg text-ink-800">Nenhuma nota encontrada</h3>
              <p className="text-sm text-ink-500">{notes.length ? 'Nenhuma nota corresponde à busca.' : 'Para registrar uma nota, inicie ou retome um atendimento abaixo.'}</p>
            </Card>
          ) : (
            filteredNotes.map(n => {
              const p = patients.find(pt => pt.id === n.patient_id);
              return (
                <Card key={n.id} className="p-6 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="size-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center font-semibold flex-shrink-0">
                        {p?.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-display text-lg text-ink-800">{p?.name}</div>
                        <div className="text-sm text-ink-500 flex items-center gap-2 mt-0.5">
                          <span>{fmtTimestampDate(n.created_at)}</span>
                          {n.professional_name && <span>· {n.professional_name}</span>}
                          {n.signed && <Badge tone="grass"><Shield className="size-3" /> Assinatura registrada no sistema</Badge>}
                          {!n.signed && <Badge tone="ink">Rascunho</Badge>}
                        </div>
                      </div>
                    </div>
                    {n.diagnostico && <Badge tone="brand">CID {n.diagnostico}</Badge>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-0.5">Subjetivo</div>
                      <div className="text-ink-700 line-clamp-2">{n.subjetivo}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-0.5">Objetivo</div>
                      <div className="text-ink-700 line-clamp-2">{n.objetivo}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-0.5">Avaliação</div>
                      <div className="text-ink-700 line-clamp-2">{n.avaliacao}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-0.5">Plano</div>
                      <div className="text-ink-700 line-clamp-2">{n.plano}</div>
                    </div>
                  </div>
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer text-brand-700 font-medium">Ver nota completa</summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {([
                        ['Queixa principal', n.queixa], ['História da doença atual', n.hda],
                        ['Antecedentes', n.antecedentes], ['Medicações', n.medicamentos],
                        ['Alergias', n.alergias], ['Hábitos', n.habitos],
                        ['Pressão arterial', n.pa], ['Frequência cardíaca', n.fc],
                        ['Frequência respiratória', n.fr], ['Temperatura', n.temp],
                        ['SpO₂', n.spo2], ['Peso', n.peso], ['Altura', n.altura],
                        ['Subjetivo', n.subjetivo], ['Objetivo', n.objetivo],
                        ['Avaliação', n.avaliacao], ['Plano', n.plano],
                        ['Hipótese diagnóstica', n.hipotese], ['Diagnóstico', n.diagnostico],
                        ['Conduta', n.conduta], ['Retorno', n.retorno],
                      ] as const).map(([label, value]) => (
                        <div key={label} className="p-3 rounded-lg bg-ink-50">
                          <div className="text-xs font-semibold text-ink-500">{label}</div>
                          <div className="text-ink-700 whitespace-pre-wrap">{value || 'Não informado'}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                </Card>
              );
            })
          )}
          {selectedPatient && !loading && !error && <PatientAppointments patientId={selectedPatient.id} />}
        </div>
      )}
    </div>
  );
}
