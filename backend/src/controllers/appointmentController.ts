import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Create appointment
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty, procedure, insurance, value, payment_method, notes, telehealth_url } = req.body;
    const user_id = req.user?.id;

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty, procedure, insurance, value, payment_method, notes, telehealth_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'agendado')
       RETURNING *`,
      [patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty, procedure, insurance, value, payment_method, notes, telehealth_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get appointments by patient
export const getAppointmentsByPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT * FROM appointments WHERE patient_id = $1 ORDER BY date DESC, start_time DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get appointments by date range
export const getAppointmentsByDateRange = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date, professional_id } = req.query;
    
    let query = `SELECT * FROM appointments WHERE date >= $1 AND date <= $2`;
    const params: any[] = [start_date, end_date];
    
    if (professional_id) {
      query += ` AND professional_id = $3`;
      params.push(professional_id);
    }
    
    query += ` ORDER BY date ASC, start_time ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update appointment
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, start_time, end_time, notes, telehealth_url } = req.body;

    const result = await pool.query(
      `UPDATE appointments SET status = COALESCE($1, status), start_time = COALESCE($2, start_time), end_time = COALESCE($3, end_time), notes = COALESCE($4, notes), telehealth_url = COALESCE($5, telehealth_url), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [status, start_time, end_time, notes, telehealth_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    res.status(400).json({ message: error.message });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE appointments SET status = 'cancelado', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error canceling appointment:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get today's appointments
export const getTodayAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { professional_id } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    let query = `SELECT * FROM appointments WHERE date = $1`;
    const params: any[] = [today];
    
    if (professional_id) {
      query += ` AND professional_id = $2`;
      params.push(professional_id);
    }
    
    query += ` ORDER BY start_time ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching today appointments:', error);
    res.status(400).json({ message: error.message });
  }
};

