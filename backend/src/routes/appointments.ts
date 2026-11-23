import express from 'express';
import * as postgres from '../controllers/appointmentController';
import * as mysql from '../mysql/appointmentController';
import { databaseDriver } from '../config/driver';
import { authMiddleware, medicoMiddleware } from '../middleware/auth';
import pool from '../config/database';
import { getPool, rows, Row } from '../mysql/database';

const router = express.Router();
const { createAppointment, getAppointmentsByPatient, getAppointmentById, getAppointmentsByDateRange,
  updateAppointment, cancelAppointment, getTodayAppointments, startAppointment } =
  databaseDriver === 'mysql' ? mysql : postgres;

// All routes require authentication
router.use(authMiddleware);

router.get('/professionals', async (_req, res) => {
  try {
    const sql = "SELECT id, name FROM users WHERE role = 'medico' ORDER BY name";
    const professionals = databaseDriver === 'mysql'
      ? await rows<Row>(getPool(), sql)
      : (await pool.query(sql)).rows;
    res.json(professionals);
  } catch (error) {
    console.error('Error fetching professionals:', error);
    res.status(500).json({ message: 'Erro ao carregar profissionais' });
  }
});

// Get today's appointments
router.get('/today', getTodayAppointments);

// Get appointments by date range
router.get('/range', getAppointmentsByDateRange);

// Get appointments by patient
router.get('/patient/:patientId', getAppointmentsByPatient);

router.post('/:id/start', medicoMiddleware, startAppointment);

// Get appointment by ID
router.get('/:id', getAppointmentById);

// Create appointment
router.post('/', createAppointment);

// Update appointment
router.put('/:id', updateAppointment);

// Cancel appointment
router.delete('/:id', cancelAppointment);

export default router;

