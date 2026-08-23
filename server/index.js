import express from 'express';
import cors from 'cors';
import net from 'net';
import { initializeDB } from './db.js';
import { createRouter } from './routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
  const db = await initializeDB();
  app.use(createRouter(db));

  const PORT = Number(process.env.PORT) || (await getFreePort());

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`VITE_API_PORT=${PORT}`);
  });
};

startServer();