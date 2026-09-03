import Joi from 'joi';

export const createRecordSchema = Joi.object({
  patientId: Joi.string().required(),
  patientName: Joi.string().optional(),
  doctorId: Joi.string().required(),
  doctorName: Joi.string().optional(),
  appointmentId: Joi.string().optional(),
  visitDate: Joi.date().optional(),
  vitals: Joi.object({
    bloodPressure: Joi.string().allow(''),
    temperature: Joi.string().allow(''),
    pulse: Joi.string().allow(''),
    weight: Joi.string().allow(''),
    height: Joi.string().allow('')
  }).optional(),
  symptoms: Joi.array().items(Joi.string()).optional(),
  diagnosis: Joi.string().allow('').optional(),
  prescriptions: Joi.array().optional(),
  labOrders: Joi.array().optional(),
  notes: Joi.string().allow('').optional(),
  followUpDate: Joi.date().optional()
});

export const prescriptionSchema = Joi.object({
  medicine: Joi.string().required(),
  dosage: Joi.string().allow('').optional(),
  frequency: Joi.string().allow('').optional(),
  duration: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional()
});

export const labOrderSchema = Joi.object({
  testName: Joi.string().required()
});
