import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from 'hms-shared';
import pharmacyRoutes from './routes/pharmacyRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pharmacy-service' });
});

app.use('/api/pharmacy', pharmacyRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// error handler
app.use(errorHandler);

export default app;
