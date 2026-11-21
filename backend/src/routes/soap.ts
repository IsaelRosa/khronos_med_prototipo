import { Router } from 'express';
import {
  createSOAPNote,
  getSOAPNotesByPatient,
  getSOAPNoteById,
  updateSOAPNote,
  signSOAPNote,
  deleteSOAPNote,
  getSOAPNoteByAppointment,
  saveAppointmentDraft,
} from '../controllers/soapController';
import { authMiddleware, medicoMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, medicoMiddleware, createSOAPNote);
router.get('/appointment/:appointmentId', authMiddleware, getSOAPNoteByAppointment);
router.put('/appointment/:appointmentId/draft', authMiddleware, medicoMiddleware, saveAppointmentDraft);
router.get('/patient/:patientId', authMiddleware, getSOAPNotesByPatient);
router.get('/:id', authMiddleware, getSOAPNoteById);
router.put('/:id', authMiddleware, medicoMiddleware, updateSOAPNote);
router.post('/:id/sign', authMiddleware, medicoMiddleware, signSOAPNote);
router.delete('/:id', authMiddleware, medicoMiddleware, deleteSOAPNote);

export default router;
