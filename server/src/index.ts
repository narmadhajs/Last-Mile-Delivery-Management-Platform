import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env';
import { connectDB } from './db/prisma';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { logger } from './utils/logger';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time live map & fleet telemetry
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  logger.info(`⚡ Client connected to real-time telemetry: ${socket.id}`);

  socket.on('join_order_room', (trackingNumber) => {
    socket.join(`order_${trackingNumber}`);
    logger.info(`Client ${socket.id} joined tracking room: order_${trackingNumber}`);
  });

  socket.on('disconnect', () => {
    logger.info(`⚡ Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    logger.debug(`${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Server startup
const PORT = config.port;

async function bootstrap() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`
=============================================================
🚀 LAST-MILE DELIVERY TRACKER API SERVER RUNNING
🌐 Port: ${PORT}
📍 URL: http://localhost:${PORT}
📚 Health Check: http://localhost:${PORT}/api/health
=============================================================
    `);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
