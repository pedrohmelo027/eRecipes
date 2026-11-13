import type { NextFunction, Request, Response } from 'express';
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function rotaNaoEncontrada(_req: Request, res: Response) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

export function tratarErros(erro: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof AppError) {
    res.status(erro.status).json({ erro: erro.message, ...(erro.campos && { campos: erro.campos }) });
    return;
  }

  if (erro instanceof ZodError) {
    const campos: Record<string, string> = {};
    for (const issue of erro.issues) {
      const chave = issue.path.join('.') || '_';
      campos[chave] ??= issue.message;
    }
    res.status(400).json({ erro: 'Confira os campos destacados', campos });
    return;
  }

  if (erro instanceof UniqueConstraintError) {
    res.status(409).json({ erro: 'Registro duplicado' });
    return;
  }

  if (erro instanceof ForeignKeyConstraintError) {
    res.status(400).json({ erro: 'Referência inválida a outro registro' });
    return;
  }

  if (erro instanceof SyntaxError && 'body' in erro) {
    res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    return;
  }

  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}
