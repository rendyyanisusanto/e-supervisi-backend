import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import apiRoutes from './routes/index';
import { errorMiddleware, notFoundMiddleware } from './common/middlewares/error.middleware';

const app = express();

// =============================
// Security Middleware
// =============================
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// =============================
// Request Parsing
// =============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================
// Logging
// =============================
app.use(morgan(env.isDev() ? 'dev' : 'combined'));

// =============================
// Static Files (uploads)
// =============================
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

// =============================
// API Routes
// =============================
app.use('/api', apiRoutes);

// =============================
// Error Handling
// =============================
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
