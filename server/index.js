import express from 'express';
import net from 'net';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { initializeDB } from './db.js';
import { createRouter } from './routes.js';
import { createAuthentication } from './auth.js';

if (existsSync('.env.local')) {
  loadEnvFile('.env.local');
}

const app = express();

app.disable('x-powered-by');

app.use(express.json({ limit: '50mb' }));

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const getFreePort = () =>
  new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.listen(0, '127.0.0.1', () => {
      const port = tester.address().port;
      tester.close(() => resolve(port));
    });

    tester.on('error', reject);
  });

const startServer = async () => {
  const { router: authRouter, requireAuth } =
    createAuthentication();

  const db = initializeDB();

  app.use('/api/auth', authRouter);
  app.use('/api', requireAuth);
  app.use(createRouter(db));

  const PORT = Number(process.env.PORT) || (await getFreePort());

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`VITE_API_PORT=${PORT}`);
  });
};

startServer();