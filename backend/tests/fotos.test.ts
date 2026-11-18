import { existsSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { Categoria } from '../src/models';
import { criarUsuario, fecharBanco, resetarBanco } from './helpers';

// PNG 1x1 válido
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

let autor: Awaited<ReturnType<typeof criarUsuario>>;
let categoriaId: number;

const arquivo = (url: string) => path.join(env.uploadDir, path.basename(url));
const enviar = (corpo: Buffer, tipo = 'image/png') =>
  request(app).post('/api/fotos').set('Authorization', autor.auth).set('Content-Type', tipo).send(corpo);
const receita = (fotoUrl: string | null) => ({
  titulo: 'Bolo',
  categoriaId,
  modoPreparo: 'Asse.',
  fotoUrl,
  itens: [{ nome: 'Ovo', quantidade: 2, unidade: 'unidade' }],
});

beforeAll(async () => {
  await resetarBanco();
  autor = await criarUsuario();
  categoriaId = (await Categoria.findOne({ where: { nome: 'Lanches' } }))!.id;
});
afterAll(fecharBanco);

describe('upload de foto da receita', () => {
  it('exige autenticação', async () => {
    const res = await request(app).post('/api/fotos').set('Content-Type', 'image/png').send(PNG);
    expect(res.status).toBe(401);
  });

  it('salva a imagem e a serve em /api/uploads', async () => {
    const res = await enviar(PNG);
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/api\/uploads\/[a-f0-9-]{36}\.png$/);
    const servida = await request(app).get(res.body.url);
    expect(servida.status).toBe(200);
    expect(servida.headers['content-type']).toContain('image/png');
  });

  it('recusa arquivos que não são imagem', async () => {
    const res = await enviar(Buffer.from('<script>alert(1)</script>'), 'image/png');
    expect(res.status).toBe(400);
    expect(res.body.campos.foto).toBeDefined();
  });

  it('recusa imagens acima de 5 MB', async () => {
    const res = await enviar(Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]));
    expect(res.status).toBe(413);
  });

  it('não aceita link externo como foto da receita', async () => {
    const res = await request(app)
      .post('/api/receitas')
      .set('Authorization', autor.auth)
      .send(receita('https://exemplo.com/bolo.jpg'));
    expect(res.status).toBe(400);
    expect(res.body.campos.fotoUrl).toBeDefined();
  });

  it('usa a foto enviada e apaga a antiga ao trocar ou excluir', async () => {
    const primeira = (await enviar(PNG)).body.url;
    const criada = await request(app).post('/api/receitas').set('Authorization', autor.auth).send(receita(primeira));
    expect(criada.status).toBe(201);
    expect(criada.body.fotoUrl).toBe(primeira);

    const segunda = (await enviar(PNG)).body.url;
    const editada = await request(app)
      .put(`/api/receitas/${criada.body.id}`)
      .set('Authorization', autor.auth)
      .send(receita(segunda));
    expect(editada.status).toBe(200);
    expect(existsSync(arquivo(primeira))).toBe(false);
    expect(existsSync(arquivo(segunda))).toBe(true);

    await request(app).delete(`/api/receitas/${criada.body.id}`).set('Authorization', autor.auth).expect(204);
    expect(existsSync(arquivo(segunda))).toBe(false);
  });

  it('retorna 404 para foto inexistente', async () => {
    const res = await request(app).get('/api/uploads/nao-existe.png');
    expect(res.status).toBe(404);
  });
});
