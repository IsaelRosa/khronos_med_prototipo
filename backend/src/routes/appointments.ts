import express from 'express';
import {
  createAppointment,
  getAppointmentsByPatient,
  getAppointmentById,
  getAppointmentsByDateRange,
  updateAppointment,
  cancelAppointment,
  getTodayAppointments
} from '../controllers/appointmentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get today's appointments
router.get('/today', getTodayAppointments);

// Get appointments by date range
router.get('/range', getAppointmentsByDateRange);

// Get appointments by patient
router.get('/patient/:patientId', getAppointmentsByPatient);

// Get appointment by ID
router.get('/:id', getAppointmentById);

// Create appointment
router.post('/', createAppointment);

// Update appointment
router.put('/:id', updateAppointment);

// Cancel appointment
router.delete('/:id', cancelAppointment);

export default router;

