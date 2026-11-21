import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

function timeSeconds(value: string): number {
  const [hours, minutes, seconds = 0] = value.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Create appointment
export const createAppointment = async (req: AuthRequest, res: Response) => {
  const { patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty, procedure, insurance, value, payment_method, notes, telehealth_url } = req.body;
  if (!patient_id || !professional_id || !validDate(date) || !validTime(start_time) || !validTime(end_time) || timeSeconds(start_time) >= timeSeconds(end_time)) {
    return res.status(400).json({ message: 'Informe paciente, profissional, data e horários válidos.' });
  }

  const client = await pool.connect().catch((error) => {
    console.error('Error connecting to database:', error);
    return null;
  });
  if (!client) return res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [professional_id, date]);
    const professional = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'medico'", [professional_id]);
    if (professional.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Profissional não encontrado.' });
    }
    const conflict = await client.query(
      `SELECT 1 FROM appointments
       WHERE professional_id = $1 AND date = $2 AND status <> 'cancelado'
         AND start_time < $4::time AND end_time > $3::time LIMIT 1`,
      [professional_id, date, start_time, end_time]
    );
    if (conflict.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Conflito de horário com outro agendamento deste profissional.' });
    }
    const result = await client.query(
      `INSERT INTO appointments (patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty, procedure, insurance, value, payment_method, notes, telehealth_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'agendado')
       RETURNING *, date::text AS date`,
      [patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty, procedure, insurance, value, payment_method, notes, telehealth_url]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Erro ao criar agendamento.' });
  } finally {
    client.release();
  }
};

// Get appointments by patient
export const getAppointmentsByPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT appointments.*, appointments.date::text AS date, users.name AS professional_name
       FROM appointments LEFT JOIN users ON users.id = appointments.professional_id
       WHERE appointments.patient_id = $1 ORDER BY appointments.date DESC, appointments.start_time DESC`,
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
    const result = await pool.query(`SELECT *, date::text AS date FROM appointments WHERE id = $1`, [id]);
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
    
    let query = `SELECT *, date::text AS date FROM appointments WHERE date >= $1 AND date <= $2`;
    const params: any[] = [start_date, end_date];
    
    if (professional_id) {
      query += ` AND professional_id = $3`;
      params.push(professional_id);
    }
    
    query += ` ORDER BY appointments.date ASC, start_time ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    res.status(400).json({ message: error.message });
  }
};

export const startAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE appointments SET status = 'em_atendimento', updated_at = NOW()
       WHERE id = $1 AND status IN ('agendado', 'confirmado', 'aguardando', 'em_atendimento')
       RETURNING *, date::text AS date`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(409).json({ message: 'Agendamento não encontrado ou indisponível para atendimento.' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao iniciar atendimento:', error);
    return res.status(500).json({ message: 'Erro ao iniciar atendimento.' });
  }
};

// Update appointment
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, start_time, end_time, notes, telehealth_url } = req.body;
  const statuses = ['agendado', 'confirmado', 'aguardando', 'em_atendimento', 'atendido', 'falta', 'cancelado', 'reagendado'];
  if ((status != null && !statuses.includes(status)) ||
      (start_time != null && !validTime(start_time)) || (end_time != null && !validTime(end_time))) {
    return res.status(400).json({ message: 'Status ou horários inválidos.' });
  }
  const client = await pool.connect().catch((error) => {
    console.error('Error connecting to database:', error);
    return null;
  });
  if (!client) return res.status(500).json({ message: 'Erro ao conectar ao banco de dados.' });

  try {
    await client.query('BEGIN');
    let existing = await client.query('SELECT *, date::text AS date FROM appointments WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Agendamento não encontrado.' });
    }
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [existing.rows[0].professional_id, existing.rows[0].date]);
    existing = await client.query('SELECT *, date::text AS date FROM appointments WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Agendamento não encontrado.' });
    }
    const current = existing.rows[0];
    const start = start_time ?? current.start_time;
    const end = end_time ?? current.end_time;
    if (timeSeconds(start) >= timeSeconds(end)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Horários inválidos.' });
    }
    if ((status ?? current.status) !== 'cancelado') {
      const conflict = await client.query(
        `SELECT 1 FROM appointments
         WHERE professional_id = $1 AND date = $2 AND status <> 'cancelado' AND id <> $5
           AND start_time < $4::time AND end_time > $3::time LIMIT 1`,
        [current.professional_id, current.date, start, end, id]
      );
      if (conflict.rowCount) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Conflito de horário com outro agendamento deste profissional.' });
      }
    }
    const result = await client.query(
      `UPDATE appointments SET status = COALESCE($1, status), start_time = COALESCE($2, start_time), end_time = COALESCE($3, end_time), notes = COALESCE($4, notes), telehealth_url = COALESCE($5, telehealth_url), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *, date::text AS date`,
      [status, start_time, end_time, notes, telehealth_url, id]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Erro ao atualizar agendamento.' });
  } finally {
    client.release();
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

