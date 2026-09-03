import { Router } from 'express';
import { verifyToken, authorize, validate } from 'hms-shared';
import { createRecordSchema, prescriptionSchema, labOrderSchema } from '../validators/emrValidator.js';
import * as emrController from '../controllers/emrController.js';

const router = Router();

// all emr routes need login
router.use(verifyToken);

// only doctors and admin can create/update medical records
router.post('/', authorize('admin', 'doctor'), validate(createRecordSchema), emrController.createRecord);
router.get('/', emrController.getRecords);
router.get('/patient/:patientId', emrController.getPatientHistory);
router.get('/:id', emrController.getRecord);
router.put('/:id', authorize('admin', 'doctor'), emrController.updateRecord);

// add prescription / lab order
router.post('/:id/prescriptions', authorize('admin', 'doctor'), validate(prescriptionSchema), emrController.addPrescription);
router.post('/:id/lab-orders', authorize('admin', 'doctor'), validate(labOrderSchema), emrController.addLabOrder);

export default router;
