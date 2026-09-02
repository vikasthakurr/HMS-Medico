import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: 'error', message: 'Too many requests, slow down' }
});
app.use(limiter);

// service urls
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:3002',
  doctor: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004',
  emr: process.env.EMR_SERVICE_URL || 'http://localhost:3005',
  lab: process.env.LAB_SERVICE_URL || 'http://localhost:3006',
  pharmacy: process.env.PHARMACY_SERVICE_URL || 'http://localhost:3007',
  billing: process.env.BILLING_SERVICE_URL || 'http://localhost:3008',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3010'
};

// routes that dont need login
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh-token'
];

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// auth middleware - checks token before proxying
app.use('/api', (req, res, next) => {
  // skip auth for public routes
  const isPublic = publicRoutes.some(route => req.originalUrl.startsWith(route));
  if (isPublic) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // pass user info to downstream services via headers
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
});

// proxy helper
const proxy = (prefix, target) => {
  app.use(prefix, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${prefix}${path}`,
    on: {
      error: (err, req, res) => {
        res.status(503).json({ status: 'error', message: 'Service unavailable' });
      }
    }
  }));
};

// setup all proxies
proxy('/api/auth', services.auth);
proxy('/api/patients', services.patient);
proxy('/api/doctors', services.doctor);
proxy('/api/appointments', services.appointment);
proxy('/api/emr', services.emr);
proxy('/api/lab', services.lab);
proxy('/api/pharmacy', services.pharmacy);
proxy('/api/billing', services.billing);
proxy('/api/notifications', services.notification);
proxy('/api/admin', services.admin);

// 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

export default app;
