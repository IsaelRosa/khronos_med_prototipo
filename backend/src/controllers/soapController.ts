import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

const draftFields = [
  'queixa', 'hda', 'antecedentes', 'medicamentos', 'alergias', 'habitos',
  'pa', 'fc', 'fr', 'temp', 'spo2', 'peso', 'altura',
  'subjetivo', 'objetivo', 'avaliacao', 'plano', 'hipotese', 'diagnostico', 'conduta', 'retorno',
] as const;

export const getSOAPNoteByAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT *, xmin::text AS version FROM soap_notes WHERE appointment_id = $1 ORDER BY created_at DESC', [req.params.appointmentId]);
    if (result.rows.length > 1) {
      return res.status(409).json({ error: 'Há mais de uma nota vinculada a este agendamento. Verifique o prontuário.' });
    }
    return res.json(result.rows[0] ?? null);
  } catch (error) {
    console.error('Erro ao obter nota do agendamento:', error);
    return res.status(500).json({ error: 'Erro ao obter nota do agendamento.' });
  }
};

export const saveAppointmentDraft = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  const { appointmentId } = req.params;
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Dados do rascunho inválidos.' });
  }
  const { expectedVersion } = req.body;
  if (draftFields.some(field => typeof req.body[field] !== 'string') ||
      (expectedVersion !== null && typeof expectedVersion !== 'string')) {
    return res.status(400).json({ error: 'Dados do rascunho inválidos.' });
  }

  const client = await pool.connect().catch(error => {
    console.error('Erro ao conectar ao banco:', error);
    return null;
  });
  if (!client) return res.status(500).json({ error: 'Erro ao conectar ao banco.' });

  try {
    await client.query('BEGIN');
    const appointment = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [appointmentId]);
    if (!appointment.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }
    if (!['agendado', 'confirmado', 'aguardando', 'em_atendimento'].includes(appointment.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Este agendamento não permite salvar um rascunho.' });
    }
    const existing = await client.query('SELECT *, xmin::text AS version FROM soap_notes WHERE appointment_id = $1 ORDER BY created_at DESC', [appointmentId]);
    if (existing.rows.length > 1) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Há mais de uma nota vinculada a este agendamento. Verifique o prontuário.' });
    }
    const current = existing.rows[0];
    if (current && (current.signed || current.professional_id !== req.user.id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'A nota está assinada ou pertence a outro profissional.' });
    }
    if ((current && current.version !== expectedVersion) || (!current && expectedVersion !== null)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'A nota foi alterada em outra sessão. Recarregue antes de salvar.' });
    }

    const values = draftFields.map(field => req.body[field]);
    let result;
    if (current) {
      const set = draftFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      result = await client.query(
        `UPDATE soap_notes SET ${set}, updated_at = clock_timestamp() WHERE id = $1 RETURNING *, xmin::text AS version`,
        [current.id, ...values]
      );
    } else {
      const placeholders = draftFields.map((_, index) => `$${index + 4}`).join(', ');
      result = await client.query(
        `INSERT INTO soap_notes (patient_id, professional_id, appointment_id, ${draftFields.join(', ')})
         VALUES ($1, $2, $3, ${placeholders}) RETURNING *, xmin::text AS version`,
        [appointment.rows[0].patient_id, req.user.id, appointmentId, ...values]
      );
    }
    await client.query("UPDATE appointments SET status = 'em_atendimento', updated_at = NOW() WHERE id = $1", [appointmentId]);
    await client.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, current ? 'UPDATE' : 'CREATE', 'SOAP_NOTE', result.rows[0].id]
    );
    await client.query('COMMIT');
    return res.status(current ? 200 : 201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao salvar rascunho:', error);
    return res.status(500).json({ error: 'Erro ao salvar rascunho.' });
  } finally {
    client.release();
  }
};

export const createSOAPNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

    const { patientId, appointmentId, queixa, hda, antecedentes, medicamentos, alergias, habitos } =
      req.body;
    const { subjetivo, objetivo, avaliacao, plano, hipotese, diagnostico, conduta, retorno } =
      req.body;
    const { pa, fc, fr, temp, spo2, peso, altura } = req.body;

    if (appointmentId) {
      return res.status(409).json({ error: 'Use o rascunho do atendimento para notas vinculadas a agendamentos.' });
    }

    if (!patientId || !queixa || !subjetivo || !objetivo || !avaliacao || !plano) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const result = await pool.query(
      `INSERT INTO soap_notes (
        patient_id, professional_id, appointment_id, 
        queixa, hda, antecedentes, medicamentos, alergias, habitos,
        subjetivo, objetivo, avaliacao, plano, hipotese, diagnostico, conduta, retorno,
        pa, fc, fr, temp, spo2, peso, altura,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24,
        NOW(), NOW()
      ) RETURNING *`,
      [
        patientId,
        req.user.id,
        appointmentId,
        queixa,
        hda,
        antecedentes,
        medicamentos,
        alergias,
        habitos,
        subjetivo,
        objetivo,
        avaliacao,
        plano,
        hipotese,
        diagnostico,
        conduta,
        retorno,
        pa,
        fc,
        fr,
        temp,
        spo2,
        peso,
        altura,
      ]
    );

    // Log auditoria
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'CREATE', 'SOAP_NOTE', result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar nota SOAP:', error);
    res.status(500).json({ error: 'Erro ao criar nota SOAP' });
  }
};

export const getSOAPNotesByPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      `SELECT soap_notes.*, users.name AS professional_name
       FROM soap_notes LEFT JOIN users ON users.id = soap_notes.professional_id
       WHERE soap_notes.patient_id = $1 ORDER BY soap_notes.created_at DESC`,
      [patientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter notas SOAP:', error);
    res.status(500).json({ error: 'Erro ao obter notas SOAP' });
  }
};

export const getSOAPNoteById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM soap_notes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nota SOAP não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter nota SOAP:', error);
    res.status(500).json({ error: 'Erro ao obter nota SOAP' });
  }
};

export const updateSOAPNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    if (!keys.length || keys.some(key => !draftFields.some(field => field === key) ||
      (typeof updates[key] !== 'string' && updates[key] !== null))) {
      return res.status(400).json({ error: 'Campos de atualização inválidos.' });
    }

    // Check if note exists and belongs to the professional
    const noteResult = await pool.query(
      'SELECT * FROM soap_notes WHERE id = $1 AND professional_id = $2',
      [id, req.user.id]
    );

    if (noteResult.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const note = noteResult.rows[0];
    if (note.signed) {
      return res.status(400).json({ error: 'Nota assinada não pode ser editada' });
    }
    if (note.appointment_id) {
      return res.status(409).json({ error: 'Use o rascunho do atendimento para editar esta nota.' });
    }

    const setClause = keys
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE soap_notes SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND signed IS NOT TRUE AND appointment_id IS NULL RETURNING *`,
      [id, ...keys.map(key => updates[key])]
    );
    if (!result.rowCount) return res.status(409).json({ error: 'A nota não pode mais ser editada.' });

    // Log auditoria
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'UPDATE', 'SOAP_NOTE', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar nota SOAP:', error);
    res.status(500).json({ error: 'Erro ao atualizar nota SOAP' });
  }
};

export const signSOAPNote = async (_req: AuthRequest, res: Response) => {
  return res.status(501).json({ error: 'Assinatura certificada ainda não está disponível.' });
};

export const deleteSOAPNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

    const { id } = req.params;

    // Check if note exists and belongs to the professional
    const noteResult = await pool.query(
      'SELECT * FROM soap_notes WHERE id = $1 AND professional_id = $2',
      [id, req.user.id]
    );

    if (noteResult.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const note = noteResult.rows[0];
    if (note.signed) {
      return res.status(400).json({ error: 'Nota assinada não pode ser deletada' });
    }
    if (note.appointment_id) {
      return res.status(409).json({ error: 'Notas vinculadas a atendimentos não podem ser deletadas por esta rota.' });
    }

    await pool.query('DELETE FROM soap_notes WHERE id = $1', [id]);

    // Log auditoria
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'DELETE', 'SOAP_NOTE', id]
    );

    res.json({ message: 'Nota SOAP deletada' });
  } catch (error) {
    console.error('Erro ao deletar nota SOAP:', error);
    res.status(500).json({ error: 'Erro ao deletar nota SOAP' });
  }
};
