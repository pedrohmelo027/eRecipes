import type { Request, Response } from 'express';
import { usuarioLogado } from '../middlewares/autenticacao';
import { UsuarioService } from '../services/UsuarioService';
import { atualizarUsuarioSchema, idSchema, pesquisaSchema } from '../validators/schemas';

export class UsuarioController {
  static async listar(req: Request, res: Response) {
    const { q } = pesquisaSchema.parse(req.query);
    res.json(await UsuarioService.listar(q));
  }

  static async atualizar(req: Request, res: Response) {
    const id = idSchema.parse(req.params.id);
    const dados = atualizarUsuarioSchema.parse(req.body);
    res.json(await UsuarioService.atualizar(usuarioLogado(req).id, id, dados));
  }

  static async desativar(req: Request, res: Response) {
    const id = idSchema.parse(req.params.id);
    res.json(await UsuarioService.desativar(usuarioLogado(req).id, id));
  }

  static async reativar(req: Request, res: Response) {
    res.json(await UsuarioService.reativar(idSchema.parse(req.params.id)));
  }
}
