import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros';
import { rotas } from './routes';

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/saude', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api', rotas);

app.use(rotaNaoEncontrada);
app.use(tratarErros);
