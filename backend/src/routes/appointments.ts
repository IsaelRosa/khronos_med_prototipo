import express from 'express';
import {
  createAppointment,
  getAppointmentsByPatient,
  getAppointmentById,
  getAppointmentsByDateRange,
  updateAppointment,
  cancelAppointment,
  getTodayAppointments,
  startAppointment
} from '../controllers/appointmentController';
import { authMiddleware, medicoMiddleware } from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/professionals', async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM users WHERE role = 'medico' ORDER BY name"
    );
    res.json(result.rows);
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

