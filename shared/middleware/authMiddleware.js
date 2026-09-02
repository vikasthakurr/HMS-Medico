import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';

// checks if user has valid token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
};

// checks if user has the required role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized', 403));
    }
    next();
  };
};
