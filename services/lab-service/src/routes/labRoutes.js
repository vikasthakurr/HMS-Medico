import { Router } from 'express';
import { verifyToken, authorize } from 'hms-shared';
import * as labController from '../controllers/labController.js';

const router = Router();

// all lab routes need login
router.use(verifyToken);

/* ---- test catalog ---- */
// only admin manages the catalog
router.post('/tests', authorize('admin'), labController.createTest);
router.get('/tests', labController.getTests);
router.put('/tests/:id', authorize('admin'), labController.updateTest);

/* ---- lab orders ---- */
// doctor/admin can order tests
router.post('/orders', authorize('admin', 'doctor'), labController.createOrder);
router.get('/orders', labController.getOrders);
router.get('/orders/:id', labController.getOrder);

// lab technician handles sample + results
router.put('/orders/:id/collect', authorize('admin', 'lab_technician'), labController.collectSample);
router.put('/orders/:id/result', authorize('admin', 'lab_technician'), labController.enterResult);
router.put('/orders/:id/cancel', authorize('admin', 'doctor', 'lab_technician'), labController.cancelOrder);

export default router;
