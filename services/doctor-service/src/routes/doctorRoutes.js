import { Router } from 'express';
import { verifyToken, authorize } from 'hms-shared';
import * as doctorController from '../controllers/doctorController.js';

const router = Router();

// all doctor routes need login
router.use(verifyToken);

// only admin can create/delete staff
router.post('/', authorize('admin'), doctorController.createDoctor);
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctor);
router.put('/:id', authorize('admin'), doctorController.updateDoctor);

// doctor can update their own availability, admin can too
router.put('/:id/availability', authorize('admin', 'doctor'), doctorController.updateAvailability);

router.delete('/:id', authorize('admin'), doctorController.deleteDoctor);

export default router;
