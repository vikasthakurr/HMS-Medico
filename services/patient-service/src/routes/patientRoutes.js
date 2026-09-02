import { Router } from 'express';
import { verifyToken, authorize } from 'hms-shared';
import * as patientController from '../controllers/patientController.js';

const router = Router();

// all patient routes need login
router.use(verifyToken);

// only staff can create/update/delete patients
router.post('/', authorize('admin', 'receptionist', 'doctor'), patientController.createPatient);
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatient);
router.put('/:id', authorize('admin', 'receptionist', 'doctor'), patientController.updatePatient);
router.delete('/:id', authorize('admin'), patientController.deletePatient);

export default router;
