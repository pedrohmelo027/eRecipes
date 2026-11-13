import type { Request, Response } from 'express';
import { usuarioLogado } from '../middlewares/autenticacao';
import { ReceitaService } from '../services/ReceitaService';
import { buscaSchema, idSchema, listagemSchema, receitaSchema } from '../validators/schemas';

export class ReceitaController {
  static async listar(req: Request, res: Response) {
    res.json(await ReceitaService.listar(listagemSchema.parse(req.query)));
  }

  static async buscar(req: Request, res: Response) {
    const { ingredientes, categoria } = buscaSchema.parse(req.query);
    res.json(await ReceitaService.buscar(ingredientes, categoria));
  }

  static async minhas(req: Request, res: Response) {
    res.json(await ReceitaService.minhas(usuarioLogado(req).id));
  }

  static async obter(req: Request, res: Response) {
    res.json(await ReceitaService.obter(idSchema.parse(req.params.id)));
  }

  static async criar(req: Request, res: Response) {
    const receita = await ReceitaService.criar(usuarioLogado(req), receitaSchema.parse(req.body));
    res.status(201).json(receita);
  }

  static async atualizar(req: Request, res: Response) {
    const id = idSchema.parse(req.params.id);
    res.json(await ReceitaService.atualizar(usuarioLogado(req), id, receitaSchema.parse(req.body)));
  }

  static async excluir(req: Request, res: Response) {
    await ReceitaService.excluir(usuarioLogado(req), idSchema.parse(req.params.id));
    res.status(204).end();
  }
}
