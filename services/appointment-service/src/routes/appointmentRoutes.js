import { Router } from 'express';
import { verifyToken, authorize, validate } from 'hms-shared';
import { bookAppointmentSchema, rescheduleSchema, statusSchema } from '../validators/appointmentValidator.js';
import * as appointmentController from '../controllers/appointmentController.js';

const router = Router();

// all appointment routes need login
router.use(verifyToken);

// book - staff or patient can book
router.post('/', validate(bookAppointmentSchema), appointmentController.bookAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointment);

// reschedule / cancel
router.put('/:id/reschedule', validate(rescheduleSchema), appointmentController.rescheduleAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);

// update status - only staff (doctor marks completed/no_show)
router.put('/:id/status', authorize('admin', 'doctor', 'receptionist'), validate(statusSchema), appointmentController.updateStatus);

export default router;
