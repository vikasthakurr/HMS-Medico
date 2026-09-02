import AppError from '../utils/appError.js';

// validates request body using a joi schema
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map(d => d.message).join(', ');
    return next(new AppError(msg, 400));
  }
  next();
};

export default validate;
