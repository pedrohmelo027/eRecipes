import type { Request, Response } from 'express';
import { usuarioLogado } from '../middlewares/autenticacao';
import { AuthService } from '../services/AuthService';
import { cadastroSchema, loginSchema } from '../validators/schemas';

export class AuthController {
  static async cadastro(req: Request, res: Response) {
    const usuario = await AuthService.cadastrar(cadastroSchema.parse(req.body));
    res.status(201).json(usuario);
  }

  static async login(req: Request, res: Response) {
    const { email, senha } = loginSchema.parse(req.body);
    res.json(await AuthService.autenticar(email, senha));
  }

  static async me(req: Request, res: Response) {
    res.json(await AuthService.perfil(usuarioLogado(req).id));
  }
}
