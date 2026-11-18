import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { requisicaoInvalida } from '../utils/AppError';

export const PREFIXO_FOTO = '/api/uploads/';
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;
export const FOTO_URL_REGEX = /^\/api\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp|gif)$/;

function detectarExtensao(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length >= 6 && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii'))) return 'gif';
  if (b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

export class FotoService {
  static async salvar(conteudo: unknown): Promise<string> {
    if (!Buffer.isBuffer(conteudo) || conteudo.length === 0) {
      throw requisicaoInvalida('Selecione uma imagem', { foto: 'Selecione uma imagem' });
    }
    const extensao = detectarExtensao(conteudo);
    if (!extensao) {
      throw requisicaoInvalida('Formato de imagem não suportado', { foto: 'Use JPG, PNG, WEBP ou GIF' });
    }
    await mkdir(env.uploadDir, { recursive: true });
    const nome = `${randomUUID()}.${extensao}`;
    await writeFile(path.join(env.uploadDir, nome), conteudo);
    return `${PREFIXO_FOTO}${nome}`;
  }

  static async remover(fotoUrl: string | null | undefined): Promise<void> {
    if (!fotoUrl || !FOTO_URL_REGEX.test(fotoUrl)) return;
    await unlink(path.join(env.uploadDir, path.basename(fotoUrl))).catch(() => undefined);
  }
}
