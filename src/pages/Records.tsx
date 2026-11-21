import { useState, useMemo, useEffect } from 'react';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { fmtDate } from '../lib/utils';
import { FileText, Shield, Search, Filter, Stethoscope, ChevronRight, Calendar, AlertCircle, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { patients as patientsAPI, PatientResponse, soap as soapAPI, SOAPResponse } from '../lib/api';

export default function Records() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [notes, setNotes] = useState<SOAPResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'notas' | 'pacientes'>('pacientes');

  // Carregar dados da API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [patientsData] = await Promise.all([
        patientsAPI.list(),
      ]);
      setPatients(patientsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (!q) return true;
      return p.name.toLowerCase().includes(q.toLowerCase()) || p.cpf.includes(q) || p.code.includes(q);
    });
  }, [q, patients]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (!q) return true;
      const p = patients.find(pt => pt.id === n.patientId);
      return p?.name.toLowerCase().includes(q.toLowerCase()) || n.diagnostico?.toLowerCase().includes(q.toLowerCase());
    });
  }, [q, notes, patients]);

  const getPatientNotes = (patientId: string) => {
    return notes.filter(n => n.patientId === patientId);
  };

  const handleViewPatientNotes = async (patientId: string) => {
    try {
      const ptNotes = await soapAPI.listByPatient(patientId);
      setNotes(ptNotes);
      setView('notas');
    } catch (err: any) {
      console.error('Erro ao carregar notas:', err);
    }
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
            <button onClick={loadData} className="text-xs text-red-700 hover:text-red-800 mt-1">Tentar novamente</button>
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
          {loading ? (
            <Card className="p-12 text-center">
              <Loader className="size-8 text-brand-500 animate-spin mx-auto mb-3" />
              <p className="text-ink-500">Carregando notas...</p>
            </Card>
          ) : filteredNotes.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="size-10 mx-auto text-ink-300 mb-3" />
              <h3 className="font-display text-lg text-ink-800">Nenhuma nota encontrada</h3>
              <p className="text-sm text-ink-500 mb-4">Inicie um atendimento para registrar a primeira nota SOAP.</p>
              <Link to="/atendimento"><Button icon={<Stethoscope className="size-4" />}>Ir para atendimento</Button></Link>
            </Card>
          ) : (
            filteredNotes.map(n => {
              const p = patients.find(pt => pt.id === n.patientId);
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
                          <span>{fmtDate(n.date)}</span>
                          {n.signed && <Badge tone="grass"><Shield className="size-3" /> Assinado</Badge>}
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
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
