import Joi from 'joi';

export const createDrugSchema = Joi.object({
  name: Joi.string().required(),
  brand: Joi.string().optional(),
  category: Joi.string().optional(),
  stock: Joi.number().min(0).optional(),
  reorderLevel: Joi.number().min(0).optional(),
  price: Joi.number().min(0).optional(),
  expiryDate: Joi.date().optional(),
  isActive: Joi.boolean().optional()
});

export const addStockSchema = Joi.object({
  quantity: Joi.number().integer().positive().required()
});

export const dispenseSchema = Joi.object({
  patientId: Joi.string().required(),
  patientName: Joi.string().optional(),
  recordId: Joi.string().optional(),
  items: Joi.array().items(Joi.object({
    drugId: Joi.string().required(),
    quantity: Joi.number().integer().positive().required()
  })).min(1).required()
});
