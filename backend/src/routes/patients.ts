import { Router } from 'express';
import * as postgres from '../controllers/patientController';
import * as mysql from '../mysql/patientController';
import { databaseDriver } from '../config/driver';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const { createPatient, getAllPatients, getPatientById, updatePatient, deletePatient, searchPatients } =
  databaseDriver === 'mysql' ? mysql : postgres;

router.post('/', authMiddleware, createPatient);
router.get('/', authMiddleware, getAllPatients);
router.get('/search', authMiddleware, searchPatients);
router.get('/:id', authMiddleware, getPatientById);
router.put('/:id', authMiddleware, updatePatient);
router.delete('/:id', authMiddleware, deletePatient);

export default router;
