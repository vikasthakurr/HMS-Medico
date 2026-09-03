import Joi from 'joi';

export const createDoctorSchema = Joi.object({
  userId: Joi.string().optional(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  staffType: Joi.string().valid('doctor', 'nurse', 'lab_technician', 'pharmacist').optional(),
  specialization: Joi.string().optional(),
  department: Joi.string().optional(),
  qualifications: Joi.array().items(Joi.string()).optional(),
  experienceYears: Joi.number().min(0).optional(),
  licenseNumber: Joi.string().optional(),
  consultationFee: Joi.number().min(0).optional(),
  availability: Joi.array().items(Joi.object({
    day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    startTime: Joi.string(),
    endTime: Joi.string(),
    isAvailable: Joi.boolean()
  })).optional()
});

export const updateDoctorSchema = createDoctorSchema.fork(
  ['firstName', 'lastName', 'email', 'phone'],
  (field) => field.optional()
);

export const availabilitySchema = Joi.object({
  availability: Joi.array().items(Joi.object({
    day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    isAvailable: Joi.boolean()
  })).min(1).required()
});
