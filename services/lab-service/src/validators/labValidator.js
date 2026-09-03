import Joi from 'joi';

export const createTestSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().optional(),
  category: Joi.string().optional(),
  sampleType: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
});

export const createOrderSchema = Joi.object({
  patientId: Joi.string().required(),
  patientName: Joi.string().optional(),
  doctorId: Joi.string().optional(),
  doctorName: Joi.string().optional(),
  recordId: Joi.string().optional(),
  testId: Joi.string().required(),
  testName: Joi.string().required()
});

export const resultSchema = Joi.object({
  result: Joi.string().required(),
  resultNotes: Joi.string().allow('').optional()
});
