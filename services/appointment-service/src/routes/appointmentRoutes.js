import { Router } from 'express';
import { verifyToken, authorize } from 'hms-shared';
import * as appointmentController from '../controllers/appointmentController.js';

const router = Router();

// all appointment routes need login
router.use(verifyToken);

// book - staff or patient can book
router.post('/', appointmentController.bookAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointment);

// reschedule / cancel
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);

// update status - only staff (doctor marks completed/no_show)
router.put('/:id/status', authorize('admin', 'doctor', 'receptionist'), appointmentController.updateStatus);

export default router;
