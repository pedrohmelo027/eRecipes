import type { Request, Response } from 'express';
import { CatalogoService } from '../services/CatalogoService';
import { pesquisaSchema } from '../validators/schemas';

export class CatalogoController {
  static async categorias(_req: Request, res: Response) {
    res.json(await CatalogoService.listarCategorias());
  }

  static async ingredientes(req: Request, res: Response) {
    const { q } = pesquisaSchema.parse(req.query);
    res.json(await CatalogoService.pesquisarIngredientes(q));
  }
}
