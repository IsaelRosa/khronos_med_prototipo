import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getPool, rows, transaction, write, logError, Row } from './database';

interface AppointmentRow extends Row {
  id: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

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

export const createAppointment = async (req: AuthRequest, res: Response) => {
  const { patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty,
    procedure, insurance, value, payment_method, notes, telehealth_url } = req.body;
  if (!patient_id || !professional_id || !validDate(date) || !validTime(start_time) ||
      !validTime(end_time) || timeSeconds(start_time) >= timeSeconds(end_time)) {
    return res.status(400).json({ message: 'Informe paciente, profissional, data e horários válidos.' });
  }
  try {
    const outcome = await transaction(async db => {
      const professional = await rows<Row>(db, "SELECT id FROM users WHERE id = ? AND role = 'medico' FOR UPDATE", [professional_id]);
      if (!professional.length) return { status: 400, body: { message: 'Profissional não encontrado.' } };
      const conflict = await rows<Row>(db, `SELECT id FROM appointments
        WHERE professional_id = ? AND date = ? AND status <> 'cancelado'
        AND start_time < ? AND end_time > ? LIMIT 1 FOR UPDATE`,
      [professional_id, date, end_time, start_time]);
      if (conflict.length) return { status: 409, body: { message: 'Conflito de horário com outro agendamento deste profissional.' } };
      const id = randomUUID();
      await write(db, `INSERT INTO appointments
        (id, patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty,
         \`procedure\`, insurance, value, payment_method, notes, telehealth_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agendado')`,
      [id, patient_id, professional_id, unit_id, date, start_time, end_time, type, specialty,
        procedure, insurance, value, payment_method, notes, telehealth_url]);
      const [appointment] = await rows<AppointmentRow>(db, 'SELECT * FROM appointments WHERE id = ?', [id]);
      return { status: 201, body: appointment };
    });
    return res.status(outcome.status).json(outcome.body);
  } catch (error) {
    logError('Error creating appointment:', error);
    return res.status(500).json({ message: 'Erro ao criar agendamento.' });
  }
};

export const getAppointmentsByPatient = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await rows<Row>(getPool(), `SELECT appointments.*, users.name AS professional_name
      FROM appointments LEFT JOIN users ON users.id = appointments.professional_id
      WHERE appointments.patient_id = ? ORDER BY appointments.date DESC, appointments.start_time DESC`, [req.params.patientId]));
  } catch (error) {
    logError('Error fetching appointments:', error);
    return res.status(500).json({ message: 'Erro ao carregar agendamentos.' });
  }
};

export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const [appointment] = await rows<AppointmentRow>(getPool(), 'SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    return res.json(appointment);
  } catch (error) {
    logError('Error fetching appointment:', error);
    return res.status(500).json({ message: 'Erro ao carregar agendamento.' });
  }
};

export const getAppointmentsByDateRange = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date, professional_id } = req.query;
    let sql = 'SELECT * FROM appointments WHERE date >= ? AND date <= ?';
    const values: unknown[] = [start_date, end_date];
    if (professional_id) { sql += ' AND professional_id = ?'; values.push(professional_id); }
    return res.json(await rows<Row>(getPool(), `${sql} ORDER BY date ASC, start_time ASC`, values));
  } catch (error) {
    logError('Error fetching appointments:', error);
    return res.status(500).json({ message: 'Erro ao carregar agendamentos.' });
  }
};

export const startAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await transaction(async db => {
      const result = await write(db, `UPDATE appointments SET status = 'em_atendimento', updated_at = NOW(6)
        WHERE id = ? AND status IN ('agendado', 'confirmado', 'aguardando', 'em_atendimento')`, [req.params.id]);
      return result.affectedRows ? (await rows<AppointmentRow>(db, 'SELECT * FROM appointments WHERE id = ?', [req.params.id]))[0] : null;
    });
    if (!appointment) return res.status(409).json({ message: 'Agendamento não encontrado ou indisponível para atendimento.' });
    return res.json(appointment);
  } catch (error) {
    logError('Erro ao iniciar atendimento:', error);
    return res.status(500).json({ message: 'Erro ao iniciar atendimento.' });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, start_time, end_time, notes, telehealth_url } = req.body;
  const statuses = ['agendado', 'confirmado', 'aguardando', 'em_atendimento', 'atendido', 'falta', 'cancelado', 'reagendado'];
  if ((status != null && !statuses.includes(status)) ||
      (start_time != null && !validTime(start_time)) || (end_time != null && !validTime(end_time))) {
    return res.status(400).json({ message: 'Status ou horários inválidos.' });
  }
  try {
    const outcome = await transaction(async db => {
      const [initial] = await rows<AppointmentRow>(db, 'SELECT * FROM appointments WHERE id = ?', [id]);
      if (!initial) return { status: 404, body: { message: 'Agendamento não encontrado.' } };
      await rows<Row>(db, 'SELECT id FROM users WHERE id = ? FOR UPDATE', [initial.professional_id]);
      const [current] = await rows<AppointmentRow>(db, 'SELECT * FROM appointments WHERE id = ? FOR UPDATE', [id]);
      if (!current) return { status: 404, body: { message: 'Agendamento não encontrado.' } };
      const start = start_time ?? current.start_time;
      const end = end_time ?? current.end_time;
      if (timeSeconds(start) >= timeSeconds(end)) return { status: 400, body: { message: 'Horários inválidos.' } };
      if ((status ?? current.status) !== 'cancelado') {
        const conflict = await rows<Row>(db, `SELECT id FROM appointments
          WHERE professional_id = ? AND date = ? AND status <> 'cancelado' AND id <> ?
          AND start_time < ? AND end_time > ? LIMIT 1 FOR UPDATE`,
        [current.professional_id, current.date, id, end, start]);
        if (conflict.length) return { status: 409, body: { message: 'Conflito de horário com outro agendamento deste profissional.' } };
      }
      await write(db, `UPDATE appointments SET status = COALESCE(?, status), start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time), notes = COALESCE(?, notes),
        telehealth_url = COALESCE(?, telehealth_url), updated_at = NOW(6) WHERE id = ?`,
      [status, start_time, end_time, notes, telehealth_url, id]);
      const [updated] = await rows<AppointmentRow>(db, 'SELECT * FROM appointments WHERE id = ?', [id]);
      return { status: 200, body: updated };
    });
    return res.status(outcome.status).json(outcome.body);
  } catch (error) {
    logError('Error updating appointment:', error);
    return res.status(500).json({ message: 'Erro ao atualizar agendamento.' });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await transaction(async db => {
      const result = await write(db, "UPDATE appointments SET status = 'cancelado', updated_at = NOW(6) WHERE id = ?", [req.params.id]);
      return result.affectedRows ? (await rows<AppointmentRow>(db, 'SELECT * FROM appointments WHERE id = ?', [req.params.id]))[0] : null;
    });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    return res.json(appointment);
  } catch (error) {
    logError('Error canceling appointment:', error);
    return res.status(500).json({ message: 'Erro ao cancelar agendamento.' });
  }
};

export const getTodayAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const values: unknown[] = [new Date().toISOString().split('T')[0]];
    let sql = 'SELECT * FROM appointments WHERE date = ?';
    if (req.query.professional_id) { sql += ' AND professional_id = ?'; values.push(req.query.professional_id); }
    return res.json(await rows<Row>(getPool(), `${sql} ORDER BY start_time ASC`, values));
  } catch (error) {
    logError('Error fetching today appointments:', error);
    return res.status(500).json({ message: 'Erro ao carregar agendamentos.' });
  }
};
