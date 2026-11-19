import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { AppError, requisicaoInvalida } from '../utils/AppError';

export const PREFIXO_FOTO = '/api/uploads/';
// A Vercel recusa requisições acima de 4,5 MB, então o limite das fotos é 4 MB.
export const TAMANHO_MAXIMO_FOTO = 4 * 1024 * 1024;

const EXTENSOES = ['jpg', 'png', 'webp', 'gif'] as const;
type Extensao = (typeof EXTENSOES)[number];
const MIME: Record<Extensao, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const NOME_ARQUIVO = `[a-f0-9-]{36}\\.(${EXTENSOES.join('|')})`;

const escaparRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Onde as fotos são guardadas: Supabase Storage (se configurado) ou a pasta local uploadDir. */
interface Armazenamento {
  readonly prefixoUrl: string;
  salvar(nome: string, conteudo: Buffer, extensao: Extensao): Promise<void>;
  remover(nome: string): Promise<void>;
}

class ArmazenamentoLocal implements Armazenamento {
  readonly prefixoUrl = PREFIXO_FOTO;

  async salvar(nome: string, conteudo: Buffer) {
    await mkdir(env.uploadDir, { recursive: true });
    await writeFile(path.join(env.uploadDir, nome), conteudo);
  }

  async remover(nome: string) {
    await unlink(path.join(env.uploadDir, nome)).catch(() => undefined);
  }
}

export class ArmazenamentoSupabase implements Armazenamento {
  readonly prefixoUrl: string;
  private bucketPronto?: Promise<void>;

  constructor(
    private readonly cliente: SupabaseClient,
    urlProjeto: string,
    private readonly bucket: string,
  ) {
    this.prefixoUrl = `${urlProjeto.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/`;
  }

  /** Cria o bucket público na primeira vez que for usado. */
  private garantirBucket() {
    this.bucketPronto ??= (async () => {
      const { data } = await this.cliente.storage.getBucket(this.bucket);
      if (data) return;
      const { error } = await this.cliente.storage.createBucket(this.bucket, {
        public: true,
        fileSizeLimit: TAMANHO_MAXIMO_FOTO,
        allowedMimeTypes: Object.values(MIME),
      });
      if (error && !/already exists/i.test(error.message)) throw error;
    })().catch((erro) => {
      this.bucketPronto = undefined;
      throw erro;
    });
    return this.bucketPronto;
  }

  async salvar(nome: string, conteudo: Buffer, extensao: Extensao) {
    await this.garantirBucket();
    const { error } = await this.cliente.storage
      .from(this.bucket)
      .upload(nome, conteudo, { contentType: MIME[extensao], upsert: false });
    if (error) throw new AppError(502, 'Não foi possível salvar a foto. Tente novamente.');
  }

  async remover(nome: string) {
    await this.cliente.storage
      .from(this.bucket)
      .remove([nome])
      .catch(() => undefined);
  }
}

function criarArmazenamento(): Armazenamento {
  const { url, serviceRoleKey, bucket } = env.supabase;
  if (!url) return new ArmazenamentoLocal();
  if (!serviceRoleKey) throw new Error('SUPABASE_URL definida sem SUPABASE_SERVICE_ROLE_KEY (veja .env.example)');
  const cliente = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return new ArmazenamentoSupabase(cliente, url, bucket);
}

const armazenamento = criarArmazenamento();

/** Só aceita fotos enviadas pelo próprio sistema (nada de link externo). */
export const FOTO_URL_REGEX = new RegExp(`^${escaparRegex(armazenamento.prefixoUrl)}${NOME_ARQUIVO}$`);

function detectarExtensao(b: Buffer): Extensao | null {
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
    const nome = `${randomUUID()}.${extensao}`;
    await armazenamento.salvar(nome, conteudo, extensao);
    return `${armazenamento.prefixoUrl}${nome}`;
  }

  static async remover(fotoUrl: string | null | undefined): Promise<void> {
    if (!fotoUrl || !FOTO_URL_REGEX.test(fotoUrl)) return;
    await armazenamento.remover(fotoUrl.slice(armazenamento.prefixoUrl.length));
  }
}
