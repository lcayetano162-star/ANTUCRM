import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import mpsQuoteRoutes from './routes/mpsQuoteRoutes';
import performanceRoutes from './routes/performanceRoutes';
import activityRoutes from './routes/activityRoutes';
import emailRoutes from './routes/emailRoutes';
import { errorHandler, requestLogger } from './middleware/validation';
import { authenticateToken } from './middleware/auth';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet());

// CORS - Configurar según el entorno
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('dev'));
app.use(requestLogger);

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API AntuCRM funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Rutas API Públicas (no requieren autenticación)
app.use('/api/mps', mpsQuoteRoutes);

// Rutas API Protegidas (requieren autenticación)
app.use('/api/performance', authenticateToken, performanceRoutes);
app.use('/api/activities', authenticateToken, activityRoutes);
app.use('/api/emails', authenticateToken, emailRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API AntuCRM',
    version: '1.0.0',
    endpoints: {
      mps: '/api/mps',
      performance: '/api/performance',
      activities: '/api/activities',
      emails: '/api/emails',
      health: '/health',
    },
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path,
  });
});

// Middleware de errores global
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🚀 ANTÚ CRM - API Backend                     ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║  Servidor corriendo en: http://localhost:${PORT}              ║
║  Health Check: http://localhost:${PORT}/health                ║
║                                                            ║
║  Endpoints disponibles:                                    ║
║  • MPS:           /api/mps/*                               ║
║  • Performance:   /api/performance/*                       ║
║  • Activities:    /api/activities/*                        ║
║  • Emails:        /api/emails/*                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
