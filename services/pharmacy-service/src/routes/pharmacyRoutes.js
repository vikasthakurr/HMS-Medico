import { Router } from 'express';
import { verifyToken, authorize, validate } from 'hms-shared';
import { createDrugSchema, addStockSchema, dispenseSchema } from '../validators/pharmacyValidator.js';
import * as pharmacyController from '../controllers/pharmacyController.js';

const router = Router();

// all pharmacy routes need login
router.use(verifyToken);

/* ---- drug inventory ---- */
// admin/pharmacist manage inventory
router.post('/drugs', authorize('admin', 'pharmacist'), validate(createDrugSchema), pharmacyController.createDrug);
router.get('/drugs', pharmacyController.getDrugs);
router.get('/drugs/low-stock', authorize('admin', 'pharmacist'), pharmacyController.getLowStock);
router.get('/drugs/:id', pharmacyController.getDrug);
router.put('/drugs/:id', authorize('admin', 'pharmacist'), pharmacyController.updateDrug);
router.put('/drugs/:id/add-stock', authorize('admin', 'pharmacist'), validate(addStockSchema), pharmacyController.addStock);

/* ---- dispensing ---- */
router.post('/dispense', authorize('admin', 'pharmacist'), validate(dispenseSchema), pharmacyController.dispenseDrugs);
router.get('/dispense', pharmacyController.getDispenses);

export default router;
