import Joi from 'joi';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM 24-hour

export const bookAppointmentSchema = Joi.object({
  patientId: Joi.string().required(),
  patientName: Joi.string().optional(),
  doctorId: Joi.string().required(),
  doctorName: Joi.string().optional(),
  date: Joi.date().required(),
  startTime: Joi.string().pattern(timePattern).required(),
  endTime: Joi.string().pattern(timePattern).required(),
  reason: Joi.string().optional()
});

export const rescheduleSchema = Joi.object({
  date: Joi.date().required(),
  startTime: Joi.string().pattern(timePattern).required(),
  endTime: Joi.string().pattern(timePattern).required()
});

export const statusSchema = Joi.object({
  status: Joi.string().valid('completed', 'no_show', 'scheduled').required(),
  notes: Joi.string().allow('').optional()
});
