import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { catalogoRoutes } from './catalogoRoutes';
import { receitaRoutes } from './receitaRoutes';
import { usuarioRoutes } from './usuarioRoutes';

export const rotas = Router();

rotas.use('/auth', authRoutes);
rotas.use('/receitas', receitaRoutes);
rotas.use('/usuarios', usuarioRoutes);
rotas.use('/', catalogoRoutes);
