import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Create prescription
export const createPrescription = async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id, professional_id, soap_note_id, date, items, observations, type, valid_from, valid_until } = req.body;

    const result = await pool.query(
      `INSERT INTO prescriptions (patient_id, professional_id, soap_note_id, date, items, observations, type, valid_from, valid_until, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ativa')
       RETURNING *`,
      [patient_id, professional_id, soap_note_id, date, JSON.stringify(items), observations, type || 'simples', valid_from, valid_until]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get prescriptions by patient
export const getPrescriptionsByPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY date DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get prescription by ID
export const getPrescriptionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM prescriptions WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update prescription
export const updatePrescription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { items, observations, status, valid_until } = req.body;

    const result = await pool.query(
      `UPDATE prescriptions SET items = COALESCE($1::jsonb, items), observations = COALESCE($2, observations), status = COALESCE($3, status), valid_until = COALESCE($4, valid_until), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *`,
      [items ? JSON.stringify(items) : null, observations, status, valid_until, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating prescription:', error);
    res.status(400).json({ message: error.message });
  }
};

// Cancel prescription
export const cancelPrescription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE prescriptions SET status = 'cancelada', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error canceling prescription:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get active prescriptions
export const getActivePrescriptions = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT * FROM prescriptions WHERE patient_id = $1 AND status = 'ativa' AND (valid_until IS NULL OR valid_until >= CURRENT_DATE) ORDER BY date DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching active prescriptions:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get prescription history by SOAP note
export const getPrescriptionBySoapNote = async (req: AuthRequest, res: Response) => {
  try {
    const { soapNoteId } = req.params;
    const result = await pool.query(
      `SELECT * FROM prescriptions WHERE soap_note_id = $1 ORDER BY date DESC`,
      [soapNoteId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete prescription (admin only)
export const deletePrescription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`DELETE FROM prescriptions WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting prescription:', error);
    res.status(400).json({ message: error.message });
  }
};
