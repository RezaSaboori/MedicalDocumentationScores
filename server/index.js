import express from 'express';
import cors from 'cors';
import { initializeDB } from './db.js';
import { createRouter } from './routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const startServer = async () => {
  const db = await initializeDB();
  app.use(createRouter(db));

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();