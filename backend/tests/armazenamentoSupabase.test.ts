import type { SupabaseClient } from '@supabase/supabase-js';
import { ArmazenamentoSupabase } from '../src/services/FotoService';

function clienteFalso(bucketExiste: boolean) {
  const arquivos = new Map<string, { conteudo: Buffer; contentType?: string }>();
  const storage = {
    getBucket: jest.fn(async () => ({ data: bucketExiste ? { id: 'fotos' } : null, error: null })),
    createBucket: jest.fn(async () => ({ data: {}, error: null })),
    from: jest.fn(() => ({
      upload: jest.fn(async (nome: string, conteudo: Buffer, opcoes: { contentType?: string }) => {
        arquivos.set(nome, { conteudo, contentType: opcoes.contentType });
        return { data: { path: nome }, error: null };
      }),
      remove: jest.fn(async (nomes: string[]) => {
        nomes.forEach((n) => arquivos.delete(n));
        return { data: [], error: null };
      }),
    })),
  };
  return { cliente: { storage } as unknown as SupabaseClient, storage, arquivos };
}

describe('armazenamento de fotos no Supabase Storage', () => {
  it('monta a URL pública do bucket', () => {
    const { cliente } = clienteFalso(true);
    const armazenamento = new ArmazenamentoSupabase(cliente, 'https://abc.supabase.co/', 'fotos');
    expect(armazenamento.prefixoUrl).toBe('https://abc.supabase.co/storage/v1/object/public/fotos/');
  });

  it('cria o bucket público uma única vez e envia com o content-type certo', async () => {
    const { cliente, storage, arquivos } = clienteFalso(false);
    const armazenamento = new ArmazenamentoSupabase(cliente, 'https://abc.supabase.co', 'fotos');

    await armazenamento.salvar('a.png', Buffer.from('x'), 'png');
    await armazenamento.salvar('b.jpg', Buffer.from('y'), 'jpg');

    expect(storage.createBucket).toHaveBeenCalledTimes(1);
    expect(storage.createBucket).toHaveBeenCalledWith('fotos', expect.objectContaining({ public: true }));
    expect(arquivos.get('a.png')?.contentType).toBe('image/png');
    expect(arquivos.get('b.jpg')?.contentType).toBe('image/jpeg');
  });

  it('não recria um bucket que já existe e remove arquivos', async () => {
    const { cliente, storage, arquivos } = clienteFalso(true);
    const armazenamento = new ArmazenamentoSupabase(cliente, 'https://abc.supabase.co', 'fotos');

    await armazenamento.salvar('a.png', Buffer.from('x'), 'png');
    await armazenamento.remover('a.png');

    expect(storage.createBucket).not.toHaveBeenCalled();
    expect(arquivos.size).toBe(0);
  });
});
