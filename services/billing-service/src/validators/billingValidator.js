import Joi from 'joi';

export const createInvoiceSchema = Joi.object({
  patientId: Joi.string().required(),
  patientName: Joi.string().optional(),
  recordId: Joi.string().optional(),
  items: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    category: Joi.string().optional(),
    quantity: Joi.number().positive().optional(),
    unitPrice: Joi.number().min(0).required()
  })).min(1).required(),
  tax: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).optional()
});

export const paymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  method: Joi.string().valid('cash', 'card', 'upi', 'insurance').optional(),
  reference: Joi.string().allow('').optional()
});
