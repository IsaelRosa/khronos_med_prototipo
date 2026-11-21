import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Card, PageHeader, Badge, Button, Field, inputCls, textareaCls, selectCls } from '../components/ui';
import { fmtDate, formatPhone } from '../lib/utils';
import { ArrowLeft, Save, Shield, AlertCircle, Plus, FileText, Heart, Activity, Droplet } from 'lucide-react';

export default function RecordsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patients = useStore(s => s.patients);
  const notes = useStore(s => s.soapNotes);
  const professionals = useStore(s => s.professionals);
  const appointments = useStore(s => s.appointments);
  
  const patient = useMemo(() => patients.find(p => p.id === id), [patients, id]);
  const patientNotes = useMemo(() => notes.filter(n => n.patientId === id), [notes, id]);
  const patientAppointments = useMemo(() => appointments.filter(a => a.patientId === id), [appointments, id]);
  
  const [activeTab, setActiveTab] = useState<'dados' | 'historico' | 'notas' | 'convenis'>('dados');
  const [newNote, setNewNote] = useState(false);

  if (!patient) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <Card className="p-12 text-center">
          <AlertCircle className="size-10 mx-auto text-ink-300 mb-3" />
          <h3 className="font-display text-lg text-ink-800">Paciente não encontrado</h3>
        </Card>
      </div>
    );
  }

  const tabData = [
    { id: 'dados', label: 'Dados Pessoais' },
    { id: 'historico', label: 'Histórico Médico' },
    { id: 'notas', label: 'Notas SOAP' },
    { id: 'convenis', label: 'Convênios' },
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-brand-600 font-semibold mb-1.5">
            <button onClick={() => navigate('/prontuarios')} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              <ArrowLeft className="size-4" /> Prontuários
            </button>
          </div>
          <h1 className="font-display text-[32px] leading-[1.05] text-ink-900">{patient.name}</h1>
          <p className="text-ink-500 text-sm mt-1.5">Código: {patient.code} • CPF: {patient.cpf}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" icon={<Save className="size-4" />}>Salvar</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-ink-200 flex gap-8 overflow-x-auto">
        {tabData.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: DADOS PESSOAIS */}
      {activeTab === 'dados' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-sm uppercase tracking-wider text-brand-600 mb-4">Dados Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome Completo">
                <input type="text" value={patient.name} disabled className={inputCls + ' bg-ink-50'} />
              </Field>
              <Field label="Data de Nascimento">
                <input type="text" value={patient.birth} disabled className={inputCls + ' bg-ink-50'} />
              </Field>
              <Field label="CPF">
                <input type="text" value={patient.cpf} disabled className={inputCls + ' bg-ink-50'} />
              </Field>
              <Field label="Sexo">
                <select disabled className={selectCls + ' bg-ink-50'} value={patient.sex}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
              </Field>
              <Field label="Email">
                <input type="text" value={patient.email} disabled className={inputCls + ' bg-ink-50'} />
              </Field>
              <Field label="Telefone">
                <input type="text" value={formatPhone(patient.phone)} disabled className={inputCls + ' bg-ink-50'} />
              </Field>
              <Field label="WhatsApp">
                <input type="text" value={formatPhone(patient.whatsapp)} disabled className={inputCls + ' bg-ink-50'} />
              </Field>
              <Field label="Contato de Emergência">
                <input type="text" value={patient.emergencyContact} disabled className={inputCls + ' bg-ink-50'} />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-sm uppercase tracking-wider text-brand-600 mb-4">Endereço</h3>
            <Field label="Endereço Completo">
              <textarea value={patient.address} disabled className={textareaCls + ' bg-ink-50'} rows={3} />
            </Field>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-sm uppercase tracking-wider text-brand-600 mb-4">Alergias e Medicamentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">Alergias Conhecidas</label>
                <div className="space-y-2">
                  {patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, i) => (
                      <Badge key={i} tone="flame">{allergy}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-ink-500">Nenhuma alergia registrada</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">Medicamentos em Uso</label>
                <div className="space-y-2">
                  {patient.medications.length > 0 ? (
                    patient.medications.map((med, i) => (
                      <Badge key={i} tone="aqua">{med}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-ink-500">Nenhum medicamento registrado</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: HISTÓRICO MÉDICO */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          {patientAppointments.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="size-10 mx-auto text-ink-300 mb-3" />
              <p className="text-sm text-ink-500">Nenhum atendimento registrado</p>
            </Card>
          ) : (
            patientAppointments.map(apt => {
              const prof = professionals.find(p => p.id === apt.professionalId);
              return (
                <Card key={apt.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-ink-800">{fmtDate(apt.date)} às {apt.start}</div>
                      <div className="text-sm text-ink-500 mt-1">
                        {prof?.name} • {prof?.specialty}
                      </div>
                      {apt.procedure && <div className="text-sm text-brand-600 mt-1">{apt.procedure}</div>}
                    </div>
                    <Badge tone="grass">{apt.status}</Badge>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB: NOTAS SOAP */}
      {activeTab === 'notas' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button icon={<Plus className="size-4" />} onClick={() => setNewNote(!newNote)}>
              {newNote ? 'Cancelar' : 'Nova Nota'}
            </Button>
          </div>

          {newNote && (
            <Card className="p-6">
              <h3 className="font-display text-lg text-ink-800 mb-4">Criar Nova Nota SOAP</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Data">
                    <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className={inputCls} />
                  </Field>
                  <Field label="Profissional">
                    <select className={selectCls}>
                      {professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                
                <Field label="Queixa Principal">
                  <textarea placeholder="Descreva a queixa principal do paciente..." className={textareaCls} rows={3} />
                </Field>
                <Field label="História da Doença Atual (HDA)">
                  <textarea placeholder="Histórico da doença atual..." className={textareaCls} rows={3} />
                </Field>
                <Field label="Antecedentes">
                  <textarea placeholder="Antecedentes médicos, cirurgias, etc..." className={textareaCls} rows={3} />
                </Field>
                
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-2 block">Vitais</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Field label="PA (mmHg)">
                      <input type="text" placeholder="120/80" className={inputCls} />
                    </Field>
                    <Field label="FC (bpm)">
                      <input type="text" placeholder="70" className={inputCls} />
                    </Field>
                    <Field label="Temp (°C)">
                      <input type="text" placeholder="36.5" className={inputCls} />
                    </Field>
                    <Field label="FR (/min)">
                      <input type="text" placeholder="16" className={inputCls} />
                    </Field>
                    <Field label="SpO2 (%)">
                      <input type="text" placeholder="98" className={inputCls} />
                    </Field>
                    <Field label="Peso (kg)">
                      <input type="text" placeholder="75" className={inputCls} />
                    </Field>
                  </div>
                </div>

                <Field label="Avaliação (A)">
                  <textarea placeholder="Avaliação clínica..." className={textareaCls} rows={3} />
                </Field>
                <Field label="Plano (P)">
                  <textarea placeholder="Plano de tratamento..." className={textareaCls} rows={3} />
                </Field>
                <Field label="CID (Diagnóstico)">
                  <input type="text" placeholder="ex: I10 - Hipertensão" className={inputCls} />
                </Field>
                
                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="secondary" onClick={() => setNewNote(false)}>Cancelar</Button>
                  <Button icon={<Save className="size-4" />}>Salvar Nota</Button>
                </div>
              </div>
            </Card>
          )}

          {patientNotes.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="size-10 mx-auto text-ink-300 mb-3" />
              <p className="text-sm text-ink-500">Nenhuma nota SOAP registrada</p>
            </Card>
          ) : (
            patientNotes.map(note => {
              const prof = professionals.find(p => p.id === note.professionalId);
              return (
                <Card key={note.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-medium text-ink-800">{fmtDate(note.date)}</div>
                      <div className="text-sm text-ink-500 mt-1">{prof?.name} — {prof?.specialty}</div>
                    </div>
                    <div className="flex gap-2">
                      {note.signed && <Badge tone="grass"><Shield className="size-3" /> Assinado</Badge>}
                      {note.diagnostico && <Badge tone="brand">CID {note.diagnostico}</Badge>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">S - Subjetivo</div>
                      <div className="text-sm text-ink-700">{note.queixa}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">O - Objetivo</div>
                      <div className="text-sm text-ink-700">{note.objetivo}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">A - Avaliação</div>
                      <div className="text-sm text-ink-700">{note.avaliacao}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">P - Plano</div>
                      <div className="text-sm text-ink-700">{note.plano}</div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB: CONVÊNIOS */}
      {activeTab === 'convenis' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-display text-sm uppercase tracking-wider text-brand-600 mb-4">Convênios</h3>
            {patient.insurance ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-brand-50 border border-brand-200">
                  <div className="font-medium text-ink-800">{patient.insurance}</div>
                  {patient.insuranceCard && (
                    <div className="text-sm text-ink-600 mt-1">Cartão: {patient.insuranceCard}</div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-500">Nenhum convênio registrado</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
