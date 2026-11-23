import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import soapRoutes from './routes/soap';
import appointmentRoutes from './routes/appointments';
import prescriptionRoutes from './routes/prescriptions';
import examRoutes from './routes/exams';
import { getJwtSecret } from './utils/jwt';
import { databaseDriver } from './config/driver';
import { getPool } from './mysql/database';

dotenv.config();
getJwtSecret();
if (databaseDriver === 'mysql') getPool();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/soap', soapRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/exam-orders', examRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📚 API Documentation:');
  console.log(`   - POST   /api/auth/register - Register new user`);
  console.log(`   - POST   /api/auth/login - Login`);
  console.log(`   - GET    /api/auth/profile - Get user profile`);
  console.log(`   - POST   /api/patients - Create patient`);
  console.log(`   - GET    /api/patients - Get all patients`);
  console.log(`   - GET    /api/patients/:id - Get patient by ID`);
  console.log(`   - PUT    /api/patients/:id - Update patient`);
  console.log(`   - DELETE /api/patients/:id - Delete patient`);
  console.log(`   - POST   /api/soap - Create SOAP note`);
  console.log(`   - GET    /api/soap/patient/:patientId - Get SOAP notes by patient`);
  console.log(`   - POST   /api/soap/:id/sign - Sign SOAP note`);
  console.log(`   - POST   /api/appointments - Create appointment`);
  console.log(`   - GET    /api/appointments/patient/:patientId - Get patient appointments`);
  console.log(`   - PUT    /api/appointments/:id - Update appointment`);
  console.log(`   - DELETE /api/appointments/:id - Cancel appointment`);
  console.log(`   - POST   /api/prescriptions - Create prescription`);
  console.log(`   - GET    /api/prescriptions/patient/:patientId - Get patient prescriptions`);
  console.log(`   - PUT    /api/prescriptions/:id - Update prescription`);
  console.log(`   - PATCH  /api/prescriptions/:id/cancel - Cancel prescription`);
  console.log(`   - POST   /api/exam-orders - Create exam order`);
  console.log(`   - GET    /api/exam-orders/patient/:patientId - Get patient exam orders`);
  console.log(`   - PUT    /api/exam-orders/:id - Update exam order`);
  console.log(`   - PATCH  /api/exam-orders/:id/cancel - Cancel exam order`);
});
