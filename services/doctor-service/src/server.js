import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 3003;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Doctor service running on port ${PORT}`));
  })
  .catch(err => {
    console.log('DB connection failed:', err.message);
    process.exit(1);
  });
