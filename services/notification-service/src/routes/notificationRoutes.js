import { Router } from 'express';
import { verifyToken, authorize, validate } from 'hms-shared';
import { sendNotificationSchema } from '../validators/notificationValidator.js';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

// all notification routes need login
router.use(verifyToken);

// staff can send notifications
router.post('/', authorize('admin', 'doctor', 'receptionist', 'lab_technician'), validate(sendNotificationSchema), notificationController.sendNotification);
router.get('/', notificationController.getNotifications);
router.get('/:id', notificationController.getNotification);
router.put('/:id/read', notificationController.markRead);
router.put('/:id/retry', authorize('admin', 'receptionist'), notificationController.retryNotification);

export default router;
