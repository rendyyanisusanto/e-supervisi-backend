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
// Helmet: disable crossOriginResourcePolicy so that cross-origin
// fetch/XHR requests from the frontend domain are not blocked.
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// =============================
// CORS
// =============================
// Parse allowed origins from env (supports comma-separated list)
// e.g. FRONTEND_URL=https://e-supervisi.simsmk.sch.id,http://localhost:5173
const allowedOrigins = env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Return null (not an Error) so Express doesn't treat it as a 500
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Handle OPTIONS preflight FIRST, before any other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

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

