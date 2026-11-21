import express from 'express';
import {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionById,
  updatePrescription,
  cancelPrescription,
  getActivePrescriptions,
  getPrescriptionBySoapNote,
  deletePrescription
} from '../controllers/prescriptionController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get active prescriptions for patient
router.get('/patient/:patientId/active', getActivePrescriptions);

// Get prescriptions by SOAP note
router.get('/soap-note/:soapNoteId', getPrescriptionBySoapNote);

// Get prescriptions by patient
router.get('/patient/:patientId', getPrescriptionsByPatient);

// Get prescription by ID
router.get('/:id', getPrescriptionById);

// Create prescription
router.post('/', createPrescription);

// Update prescription
router.put('/:id', updatePrescription);

// Cancel prescription
router.patch('/:id/cancel', cancelPrescription);

// Delete prescription (admin only)
router.delete('/:id', deletePrescription);

export default router;
