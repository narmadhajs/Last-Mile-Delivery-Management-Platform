import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-logitrack-jwt-token-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  defaultVolumetricDivisor: parseFloat(process.env.DEFAULT_VOLUMETRIC_DIVISOR || '5000'),
  maxAgentConcurrentOrders: parseInt(process.env.MAX_AGENT_CONCURRENT_ORDERS || '5', 10),
  autoAssignmentRadiusKm: parseFloat(process.env.AUTO_ASSIGNMENT_RADIUS_KM || '25'),
  enableRealNotifications: process.env.ENABLE_REAL_NOTIFICATIONS === 'true',
};
