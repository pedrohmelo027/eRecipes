import { Router } from 'express';
import { CatalogoController } from '../controllers/CatalogoController';

export const catalogoRoutes = Router();

catalogoRoutes.get('/categorias', CatalogoController.categorias);
catalogoRoutes.get('/ingredientes', CatalogoController.ingredientes);
