import express from 'express';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { initializeDB } from './db.js';
import { createRouter } from './routes.js';
import { createAuthentication } from './auth.js';
import { startOnStablePort } from './port.js';

if (existsSync('.env.local')) {
  loadEnvFile('.env.local');
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 'loopback');

app.use(express.json({ limit: '50mb' }));

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const startServer = async () => {
  const { router: authRouter, requireAuth } =
    createAuthentication();

  const db = initializeDB();

  app.use('/api/auth', authRouter);
  app.use('/api', requireAuth);
  app.use(createRouter(db));

  await startOnStablePort(app);
};

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});