import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { battlesRoutes } from './routes/battles.routes.js';
import { studentsRoutes } from './routes/students.routes.js';
import { leaderboardRoutes } from './routes/leaderboard.routes.js';
import { reportsRoutes } from './routes/reports.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { StorageService } from './services/storage.service.js';

export async function buildApp() {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'error' : 'info',
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
              }
            }
          : undefined
    },
    trustProxy: true
  });

  // Security Headers
  await app.register(fastifyHelmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // Handled cleanly with Next.js
  });

  // CORS
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow localhost in development or specified origin
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === env.CORS_ORIGIN) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Cookies
  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET
  });

  // JWT
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });

  // Multipart uploads (5MB max)
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });

  // Static media serving
  await StorageService.init();
  await app.register(fastifyStatic, {
    root: path.resolve(env.STORAGE_LOCAL_PATH),
    prefix: '/api/v1/media/',
    decorateReply: false
  });

  // Rate Limiting
  await app.register(fastifyRateLimit, {
    max: env.RATE_LIMIT_MAX_PER_MINUTE,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost']
  });

  // Health and Readiness Checks
  app.get('/health', async () => ({ status: 'UP', timestamp: new Date().toISOString() }));
  app.get('/health/ready', async () => ({ status: 'READY', uptime: process.uptime() }));
  app.get('/metrics', async () => ({
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    timestamp: new Date().toISOString()
  }));

  // Register API v1 Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(battlesRoutes, { prefix: '/api/v1/battles' });
  await app.register(studentsRoutes, { prefix: '/api/v1/students' });
  await app.register(leaderboardRoutes, { prefix: '/api/v1/leaderboard' });
  await app.register(reportsRoutes, { prefix: '/api/v1/reports' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  // Centralized Error Handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error({
      err: error,
      url: request.url,
      method: request.method
    }, 'Unhandled Request Error');

    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      statusCode,
      error: error.name || 'InternalServerError',
      message: statusCode === 500 ? 'An unexpected internal server error occurred' : error.message
    });
  });

  return app;
}
