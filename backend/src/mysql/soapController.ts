import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getPool, rows, transaction, write, logError, Row } from './database';

const draftFields = [
  'queixa', 'hda', 'antecedentes', 'medicamentos', 'alergias', 'habitos',
  'pa', 'fc', 'fr', 'temp', 'spo2', 'peso', 'altura',
  'subjetivo', 'objetivo', 'avaliacao', 'plano', 'hipotese', 'diagnostico', 'conduta', 'retorno',
] as const;

interface NoteRow extends Row {
  id: string;
  patient_id: string;
  professional_id: string;
  appointment_id: string | null;
  signed: number | boolean | null;
  version: string;
}

interface AppointmentRow extends Row {
  patient_id: string;
  status: string;
}

function noteResponse(note: NoteRow) {
  return { ...note, signed: note.signed === null ? null : Boolean(note.signed) };
}

export const getSOAPNoteByAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await rows<NoteRow>(getPool(),
      'SELECT *, CAST(version AS CHAR) AS version FROM soap_notes WHERE appointment_id = ? ORDER BY created_at DESC',
      [req.params.appointmentId]);
    if (notes.length > 1) return res.status(409).json({ error: 'Há mais de uma nota vinculada a este agendamento. Verifique o prontuário.' });
    return res.json(notes[0] ? noteResponse(notes[0]) : null);
  } catch (error) {
    logError('Erro ao obter nota do agendamento:', error);
    return res.status(500).json({ error: 'Erro ao obter nota do agendamento.' });
  }
};

export const saveAppointmentDraft = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Dados do rascunho inválidos.' });
  }
  const { expectedVersion } = req.body;
  if (draftFields.some(field => typeof req.body[field] !== 'string') ||
      (expectedVersion !== null && typeof expectedVersion !== 'string')) {
    return res.status(400).json({ error: 'Dados do rascunho inválidos.' });
  }
  const user = req.user;
  const { appointmentId } = req.params;
  try {
    const outcome = await transaction(async db => {
      const [appointment] = await rows<AppointmentRow>(db, 'SELECT * FROM appointments WHERE id = ? FOR UPDATE', [appointmentId]);
      if (!appointment) return { status: 404, body: { error: 'Agendamento não encontrado.' } };
      if (!['agendado', 'confirmado', 'aguardando', 'em_atendimento'].includes(appointment.status)) {
        return { status: 409, body: { error: 'Este agendamento não permite salvar um rascunho.' } };
      }
      const existing = await rows<NoteRow>(db, `SELECT *, CAST(version AS CHAR) AS version FROM soap_notes
        WHERE appointment_id = ? ORDER BY created_at DESC FOR UPDATE`, [appointmentId]);
      if (existing.length > 1) return { status: 409, body: { error: 'Há mais de uma nota vinculada a este agendamento. Verifique o prontuário.' } };
      const current = existing[0];
      if (current && (current.signed || current.professional_id !== user.id)) {
        return { status: 403, body: { error: 'A nota está assinada ou pertence a outro profissional.' } };
      }
      if ((current && current.version !== expectedVersion) || (!current && expectedVersion !== null)) {
        return { status: 409, body: { error: 'A nota foi alterada em outra sessão. Recarregue antes de salvar.' } };
      }
      const values = draftFields.map(field => req.body[field]);
      const id = current?.id ?? randomUUID();
      if (current) {
        await write(db, `UPDATE soap_notes SET ${draftFields.map(field => `\`${field}\` = ?`).join(', ')},
          version = version + 1, updated_at = NOW(6) WHERE id = ?`, [...values, id]);
      } else {
        await write(db, `INSERT INTO soap_notes (id, patient_id, professional_id, appointment_id, ${draftFields.map(field => `\`${field}\``).join(', ')})
          VALUES (?, ?, ?, ?, ${draftFields.map(() => '?').join(', ')})`,
        [id, appointment.patient_id, user.id, appointmentId, ...values]);
      }
      await write(db, "UPDATE appointments SET status = 'em_atendimento', updated_at = NOW(6) WHERE id = ?", [appointmentId]);
      await write(db, 'INSERT INTO audit_logs (id, user_id, action, entity, entity_id) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), user.id, current ? 'UPDATE' : 'CREATE', 'SOAP_NOTE', id]);
      const [note] = await rows<NoteRow>(db, 'SELECT *, CAST(version AS CHAR) AS version FROM soap_notes WHERE id = ?', [id]);
      return { status: current ? 200 : 201, body: noteResponse(note) };
    });
    return res.status(outcome.status).json(outcome.body);
  } catch (error) {
    logError('Erro ao salvar rascunho:', error);
    return res.status(500).json({ error: 'Erro ao salvar rascunho.' });
  }
};

export const createSOAPNote = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  const user = req.user;
  const { patientId, appointmentId, queixa, subjetivo, objetivo, avaliacao, plano } = req.body;
  if (appointmentId) return res.status(409).json({ error: 'Use o rascunho do atendimento para notas vinculadas a agendamentos.' });
  if (!patientId || !queixa || !subjetivo || !objetivo || !avaliacao || !plano) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  try {
    const id = randomUUID();
    const note = await transaction(async db => {
      await write(db, `INSERT INTO soap_notes (id, patient_id, professional_id, appointment_id, ${draftFields.map(field => `\`${field}\``).join(', ')})
        VALUES (?, ?, ?, ?, ${draftFields.map(() => '?').join(', ')})`,
      [id, patientId, user.id, null, ...draftFields.map(field => req.body[field])]);
      await write(db, 'INSERT INTO audit_logs (id, user_id, action, entity, entity_id) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), user.id, 'CREATE', 'SOAP_NOTE', id]);
      const [saved] = await rows<NoteRow>(db, 'SELECT *, CAST(version AS CHAR) AS version FROM soap_notes WHERE id = ?', [id]);
      return noteResponse(saved);
    });
    return res.status(201).json(note);
  } catch (error) {
    logError('Erro ao criar nota SOAP:', error);
    return res.status(500).json({ error: 'Erro ao criar nota SOAP' });
  }
};

export const getSOAPNotesByPatient = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await rows<NoteRow>(getPool(), `SELECT soap_notes.*, CAST(soap_notes.version AS CHAR) AS version,
      users.name AS professional_name FROM soap_notes LEFT JOIN users ON users.id = soap_notes.professional_id
      WHERE soap_notes.patient_id = ? ORDER BY soap_notes.created_at DESC`, [req.params.patientId]);
    return res.json(notes.map(noteResponse));
  } catch (error) {
    logError('Erro ao obter notas SOAP:', error);
    return res.status(500).json({ error: 'Erro ao obter notas SOAP' });
  }
};

export const getSOAPNoteById = async (req: AuthRequest, res: Response) => {
  try {
    const [note] = await rows<NoteRow>(getPool(),
      'SELECT *, CAST(version AS CHAR) AS version FROM soap_notes WHERE id = ?', [req.params.id]);
    if (!note) return res.status(404).json({ error: 'Nota SOAP não encontrada' });
    return res.json(noteResponse(note));
  } catch (error) {
    logError('Erro ao obter nota SOAP:', error);
    return res.status(500).json({ error: 'Erro ao obter nota SOAP' });
  }
};

export const updateSOAPNote = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  const user = req.user;
  const updates = req.body;
  const keys = Object.keys(updates);
  if (!keys.length || keys.some(key => !draftFields.some(field => field === key) ||
      (typeof updates[key] !== 'string' && updates[key] !== null))) {
    return res.status(400).json({ error: 'Campos de atualização inválidos.' });
  }
  try {
    const outcome = await transaction(async db => {
      const [note] = await rows<NoteRow>(db, 'SELECT *, CAST(version AS CHAR) AS version FROM soap_notes WHERE id = ? AND professional_id = ? FOR UPDATE',
        [req.params.id, user.id]);
      if (!note) return { status: 403, body: { error: 'Acesso negado' } };
      if (note.signed) return { status: 400, body: { error: 'Nota assinada não pode ser editada' } };
      if (note.appointment_id) return { status: 409, body: { error: 'Use o rascunho do atendimento para editar esta nota.' } };
      await write(db, `UPDATE soap_notes SET ${keys.map(key => `\`${key}\` = ?`).join(', ')},
        version = version + 1, updated_at = NOW(6) WHERE id = ?`, [...keys.map(key => updates[key]), note.id]);
      await write(db, 'INSERT INTO audit_logs (id, user_id, action, entity, entity_id) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), user.id, 'UPDATE', 'SOAP_NOTE', note.id]);
      const [saved] = await rows<NoteRow>(db, 'SELECT *, CAST(version AS CHAR) AS version FROM soap_notes WHERE id = ?', [note.id]);
      return { status: 200, body: noteResponse(saved) };
    });
    return res.status(outcome.status).json(outcome.body);
  } catch (error) {
    logError('Erro ao atualizar nota SOAP:', error);
    return res.status(500).json({ error: 'Erro ao atualizar nota SOAP' });
  }
};

export const signSOAPNote = async (_req: AuthRequest, res: Response) => {
  return res.status(501).json({ error: 'Assinatura certificada ainda não está disponível.' });
};

export const deleteSOAPNote = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  const user = req.user;
  try {
    const outcome = await transaction(async db => {
      const [note] = await rows<NoteRow>(db, 'SELECT *, CAST(version AS CHAR) AS version FROM soap_notes WHERE id = ? AND professional_id = ? FOR UPDATE',
        [req.params.id, user.id]);
      if (!note) return { status: 403, body: { error: 'Acesso negado' } };
      if (note.signed) return { status: 400, body: { error: 'Nota assinada não pode ser deletada' } };
      if (note.appointment_id) return { status: 409, body: { error: 'Notas vinculadas a atendimentos não podem ser deletadas por esta rota.' } };
      await write(db, 'DELETE FROM soap_notes WHERE id = ?', [note.id]);
      await write(db, 'INSERT INTO audit_logs (id, user_id, action, entity, entity_id) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), user.id, 'DELETE', 'SOAP_NOTE', note.id]);
      return { status: 200, body: { message: 'Nota SOAP deletada' } };
    });
    return res.status(outcome.status).json(outcome.body);
  } catch (error) {
    logError('Erro ao deletar nota SOAP:', error);
    return res.status(500).json({ error: 'Erro ao deletar nota SOAP' });
  }
};
