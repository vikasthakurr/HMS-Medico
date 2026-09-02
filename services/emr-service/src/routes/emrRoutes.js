import { Router } from 'express';
import { verifyToken, authorize } from 'hms-shared';
import * as emrController from '../controllers/emrController.js';

const router = Router();

// all emr routes need login
router.use(verifyToken);

// only doctors and admin can create/update medical records
router.post('/', authorize('admin', 'doctor'), emrController.createRecord);
router.get('/', emrController.getRecords);
router.get('/patient/:patientId', emrController.getPatientHistory);
router.get('/:id', emrController.getRecord);
router.put('/:id', authorize('admin', 'doctor'), emrController.updateRecord);

// add prescription / lab order
router.post('/:id/prescriptions', authorize('admin', 'doctor'), emrController.addPrescription);
router.post('/:id/lab-orders', authorize('admin', 'doctor'), emrController.addLabOrder);

export default router;
