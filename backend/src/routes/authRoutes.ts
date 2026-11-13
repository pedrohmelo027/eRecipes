import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { autenticacao } from '../middlewares/autenticacao';

export const authRoutes = Router();

authRoutes.post('/cadastro', AuthController.cadastro);
authRoutes.post('/login', AuthController.login);
authRoutes.get('/me', autenticacao, AuthController.me);
