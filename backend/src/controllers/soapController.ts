import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createSOAPNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

    const { patientId, appointmentId, queixa, hda, antecedentes, medicamentos, alergias, habitos } =
      req.body;
    const { subjetivo, objetivo, avaliacao, plano, hipotese, diagnostico, conduta, retorno } =
      req.body;
    const { pa, fc, fr, temp, spo2, peso, altura } = req.body;

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
      `SELECT * FROM soap_notes WHERE patient_id = $1 ORDER BY created_at DESC`,
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

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE soap_notes SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );

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

export const signSOAPNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

    const { id } = req.params;

    // Verify note belongs to this professional
    const noteResult = await pool.query(
      'SELECT * FROM soap_notes WHERE id = $1 AND professional_id = $2',
      [id, req.user.id]
    );

    if (noteResult.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const result = await pool.query(
      'UPDATE soap_notes SET signed = TRUE, signed_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    // Log auditoria
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'SIGN', 'SOAP_NOTE', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao assinar nota SOAP:', error);
    res.status(500).json({ error: 'Erro ao assinar nota SOAP' });
  }
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
