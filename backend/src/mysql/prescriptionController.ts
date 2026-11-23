import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getPool, rows, transaction, updateAndFetch, write, logError, Row } from './database';

export const createPrescription = async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id, professional_id, soap_note_id, date, items, observations, type, valid_from, valid_until } = req.body;
    const id = randomUUID();
    const prescription = await transaction(async db => {
      await write(db, `INSERT INTO prescriptions
        (id, patient_id, professional_id, soap_note_id, date, items, observations, type, valid_from, valid_until, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativa')`,
      [id, patient_id, professional_id, soap_note_id, date, JSON.stringify(items), observations, type || 'simples', valid_from, valid_until]);
      return (await rows<Row>(db, 'SELECT * FROM prescriptions WHERE id = ?', [id]))[0];
    });
    return res.status(201).json(prescription);
  } catch (error) {
    logError('Error creating prescription:', error);
    return res.status(500).json({ message: 'Erro ao criar prescrição.' });
  }
};

export const getPrescriptionsByPatient = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await rows<Row>(getPool(), 'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date DESC', [req.params.patientId]));
  } catch (error) {
    logError('Error fetching prescriptions:', error);
    return res.status(500).json({ message: 'Erro ao carregar prescrições.' });
  }
};

export const getPrescriptionById = async (req: AuthRequest, res: Response) => {
  try {
    const [prescription] = await rows<Row>(getPool(), 'SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    return res.json(prescription);
  } catch (error) {
    logError('Error fetching prescription:', error);
    return res.status(500).json({ message: 'Erro ao carregar prescrição.' });
  }
};

export const updatePrescription = async (req: AuthRequest, res: Response) => {
  try {
    const { items, observations, status, valid_until } = req.body;
    const prescription = await updateAndFetch('prescriptions',
      'items = COALESCE(?, items), observations = COALESCE(?, observations), status = COALESCE(?, status), valid_until = COALESCE(?, valid_until)',
      [items ? JSON.stringify(items) : null, observations, status, valid_until], req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    return res.json(prescription);
  } catch (error) {
    logError('Error updating prescription:', error);
    return res.status(500).json({ message: 'Erro ao atualizar prescrição.' });
  }
};

export const cancelPrescription = async (req: AuthRequest, res: Response) => {
  try {
    const prescription = await updateAndFetch('prescriptions', "status = 'cancelada'", [], req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    return res.json(prescription);
  } catch (error) {
    logError('Error canceling prescription:', error);
    return res.status(500).json({ message: 'Erro ao cancelar prescrição.' });
  }
};

export const getActivePrescriptions = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await rows<Row>(getPool(), `SELECT * FROM prescriptions WHERE patient_id = ? AND status = 'ativa'
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE) ORDER BY date DESC`, [req.params.patientId]));
  } catch (error) {
    logError('Error fetching active prescriptions:', error);
    return res.status(500).json({ message: 'Erro ao carregar prescrições.' });
  }
};

export const getPrescriptionBySoapNote = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await rows<Row>(getPool(), 'SELECT * FROM prescriptions WHERE soap_note_id = ? ORDER BY date DESC', [req.params.soapNoteId]));
  } catch (error) {
    logError('Error fetching prescription:', error);
    return res.status(500).json({ message: 'Erro ao carregar prescrições.' });
  }
};

export const deletePrescription = async (req: AuthRequest, res: Response) => {
  try {
    const result = await write(getPool(), 'DELETE FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Prescription not found' });
    return res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    logError('Error deleting prescription:', error);
    return res.status(500).json({ message: 'Erro ao excluir prescrição.' });
  }
};
