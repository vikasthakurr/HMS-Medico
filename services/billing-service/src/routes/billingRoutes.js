import { Router } from 'express';
import { verifyToken, authorize, validate } from 'hms-shared';
import { createInvoiceSchema, paymentSchema } from '../validators/billingValidator.js';
import * as billingController from '../controllers/billingController.js';

const router = Router();

// all billing routes need login
router.use(verifyToken);

// admin/receptionist handle billing
router.post('/', authorize('admin', 'receptionist'), validate(createInvoiceSchema), billingController.createInvoice);
router.get('/', billingController.getInvoices);
router.get('/:id', billingController.getInvoice);
router.post('/:id/payments', authorize('admin', 'receptionist'), validate(paymentSchema), billingController.recordPayment);
router.put('/:id/cancel', authorize('admin', 'receptionist'), billingController.cancelInvoice);

export default router;
