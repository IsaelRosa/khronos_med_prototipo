import { Router } from 'express';
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients,
} from '../controllers/patientController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createPatient);
router.get('/', authMiddleware, getAllPatients);
router.get('/search', authMiddleware, searchPatients);
router.get('/:id', authMiddleware, getPatientById);
router.put('/:id', authMiddleware, updatePatient);
router.delete('/:id', authMiddleware, deletePatient);

export default router;
