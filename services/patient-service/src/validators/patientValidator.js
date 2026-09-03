import Joi from 'joi';

export const createPatientSchema = Joi.object({
  userId: Joi.string().optional(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
    country: Joi.string().allow('')
  }).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().allow(''),
    relation: Joi.string().allow(''),
    phone: Joi.string().allow('')
  }).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),
  insurance: Joi.object({
    provider: Joi.string().allow(''),
    policyNumber: Joi.string().allow(''),
    validTill: Joi.date()
  }).optional()
});

// update allows any subset of the fields
export const updatePatientSchema = createPatientSchema.fork(
  ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender'],
  (field) => field.optional()
);
