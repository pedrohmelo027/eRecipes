export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly campos?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const naoEncontrado = (msg: string) => new AppError(404, msg);
export const proibido = (msg = 'Você não tem permissão para esta ação') => new AppError(403, msg);
export const conflito = (msg: string, campos?: Record<string, string>) => new AppError(409, msg, campos);
export const requisicaoInvalida = (msg: string, campos?: Record<string, string>) =>
  new AppError(400, msg, campos);
