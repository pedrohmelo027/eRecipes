import type { NextFunction, Request, Response } from 'express';
import { TipoUsuario } from '../models';
import { AppError } from '../utils/AppError';

export function exigirPerfil(...perfis: TipoUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) throw new AppError(401, 'Faça login para continuar');
    if (!perfis.includes(req.usuario.tipoUsuario)) {
      throw new AppError(403, 'Você não tem permissão para acessar este recurso');
    }
    next();
  };
}
