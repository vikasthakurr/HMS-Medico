import Joi from 'joi';

export const sendNotificationSchema = Joi.object({
  recipientId: Joi.string().optional(),
  recipient: Joi.string().required(),
  channel: Joi.string().valid('email', 'sms').optional(),
  type: Joi.string().valid('appointment_reminder', 'lab_result', 'payment', 'general').optional(),
  subject: Joi.string().allow('').optional(),
  message: Joi.string().required()
});
