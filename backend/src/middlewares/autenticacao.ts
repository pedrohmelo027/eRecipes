import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TipoUsuario, Usuario } from '../models';
import { AppError } from '../utils/AppError';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  tipoUsuario: TipoUsuario;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

interface PayloadToken {
  sub: string;
  tipoUsuario: TipoUsuario;
}

export async function autenticacao(req: Request, _res: Response, next: NextFunction) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) {
    throw new AppError(401, 'Faça login para continuar');
  }

  let payload: PayloadToken;
  try {
    payload = jwt.verify(token, env.jwt.secret) as unknown as PayloadToken;
  } catch {
    throw new AppError(401, 'Sessão expirada ou inválida. Faça login novamente');
  }

  const usuario = await Usuario.findByPk(Number(payload.sub));
  if (!usuario || !usuario.ativo) {
    throw new AppError(401, 'Sessão expirada ou inválida. Faça login novamente');
  }

  req.usuario = { id: usuario.id, nome: usuario.nome, tipoUsuario: usuario.tipoUsuario };
  next();
}

export function usuarioLogado(req: Request): UsuarioAutenticado {
  if (!req.usuario) throw new AppError(401, 'Faça login para continuar');
  return req.usuario;
}
