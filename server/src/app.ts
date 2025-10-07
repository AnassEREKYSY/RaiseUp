import express from 'express';
import cors from 'cors';
import { router } from './routes';

const app = express();

app.use(cors({ origin: ['http://localhost:4200'], credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'API running' }));

app.use('/api', router);

export default app;
