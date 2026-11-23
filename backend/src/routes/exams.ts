import express from 'express';
import * as postgres from '../controllers/examController';
import * as mysql from '../mysql/examController';
import { databaseDriver } from '../config/driver';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const { createExamOrder, getExamOrdersByPatient, getExamOrderById, updateExamOrderStatus,
  cancelExamOrder, getPendingExamOrders, getExamOrderBySoapNote, getExamOrdersByUnit, deleteExamOrder } =
  databaseDriver === 'mysql' ? mysql : postgres;

// All routes require authentication
router.use(authMiddleware);

// Get pending exam orders
router.get('/pending', getPendingExamOrders);

// Get exam orders by unit
router.get('/unit/:unitId', getExamOrdersByUnit);

// Get exam orders by SOAP note
router.get('/soap-note/:soapNoteId', getExamOrderBySoapNote);

// Get exam orders by patient
router.get('/patient/:patientId', getExamOrdersByPatient);

// Get exam order by ID
router.get('/:id', getExamOrderById);

// Create exam order
router.post('/', createExamOrder);

// Update exam order status
router.put('/:id', updateExamOrderStatus);

// Cancel exam order
router.patch('/:id/cancel', cancelExamOrder);

// Delete exam order (admin only)
router.delete('/:id', deleteExamOrder);

export default router;
