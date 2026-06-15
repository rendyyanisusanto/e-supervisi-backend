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

// Parse allowed origins from env (supports comma-separated list)
const rawOrigins = env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = rawOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
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
