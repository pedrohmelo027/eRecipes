import request from 'supertest';
import { app } from '../src/app';
import { Categoria, Ingrediente, ItemReceita, TipoUsuario } from '../src/models';
import { criarUsuario, fecharBanco, resetarBanco } from './helpers';

let autor: Awaited<ReturnType<typeof criarUsuario>>;
let outro: Awaited<ReturnType<typeof criarUsuario>>;
let admin: Awaited<ReturnType<typeof criarUsuario>>;
let categoriaId: number;

const novaReceita = () => ({
  titulo: 'Panqueca',
  categoriaId,
  modoPreparo: 'Bata tudo e frite.',
  tempoPreparo: 20,
  rendimento: 4,
  itens: [
    { nome: 'Ovo', quantidade: 2, unidade: 'unidade' },
    { nome: '  LEITE ', quantidade: 1.5, unidade: 'xícara' },
    { nome: 'Farinha de Trigo', quantidade: 1, unidade: 'xícara' },
  ],
});

beforeAll(async () => {
  await resetarBanco();
  autor = await criarUsuario();
  outro = await criarUsuario();
  admin = await criarUsuario({ tipoUsuario: TipoUsuario.ADMIN });
  categoriaId = (await Categoria.findOne({ where: { nome: 'Lanches' } }))!.id;
});
afterAll(fecharBanco);

describe('UC03 FA02 — cadastrar receita', () => {
  it('cria a receita com itens e normaliza os ingredientes', async () => {
    const res = await request(app).post('/api/receitas').set('Authorization', autor.auth).send(novaReceita());
    expect(res.status).toBe(201);
    expect(res.body.autor.id).toBe(autor.usuario.id);
    const nomes = res.body.itens.map((i: { ingrediente: { nome: string } }) => i.ingrediente.nome).sort();
    expect(nomes).toEqual(['farinha de trigo', 'leite', 'ovo']);
    expect(res.body.itens.find((i: { unidade: string }) => i.unidade === 'xícara' ).quantidade).toEqual(expect.any(Number));
  });

  it('reaproveita ingrediente existente ignorando maiúsculas e acentos', async () => {
    await request(app)
      .post('/api/receitas')
      .set('Authorization', autor.auth)
      .send({ ...novaReceita(), titulo: 'Outra', itens: [{ nome: 'OVO' }] });
    expect(await Ingrediente.count({ where: { nome: 'ovo' } })).toBe(1);
  });

  it('recusa ingrediente repetido na mesma receita', async () => {
    const res = await request(app)
      .post('/api/receitas')
      .set('Authorization', autor.auth)
      .send({ ...novaReceita(), itens: [{ nome: 'açúcar' }, { nome: 'ACUCAR' }] });
    expect(res.status).toBe(400);
  });

  it('exige título, categoria, ingrediente e modo de preparo (RN04)', async () => {
    const res = await request(app).post('/api/receitas').set('Authorization', autor.auth).send({ itens: [] });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.campos)).toEqual(expect.arrayContaining(['titulo', 'categoriaId', 'modoPreparo', 'itens']));
  });

  it('recusa categoria fora da lista (RN07)', async () => {
    const res = await request(app)
      .post('/api/receitas')
      .set('Authorization', autor.auth)
      .send({ ...novaReceita(), categoriaId: 9999 });
    expect(res.status).toBe(400);
  });

  it('exige login para cadastrar', async () => {
    expect((await request(app).post('/api/receitas').send(novaReceita())).status).toBe(401);
  });
});

describe('UC04 — visualizar receita (RN08)', () => {
  it('é pública', async () => {
    const criada = await request(app).post('/api/receitas').set('Authorization', autor.auth).send(novaReceita());
    const res = await request(app).get(`/api/receitas/${criada.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Panqueca');
  });

  it('retorna 404 para receita inexistente', async () => {
    expect((await request(app).get('/api/receitas/99999')).status).toBe(404);
  });
});

describe('RN05 — permissões de edição e exclusão', () => {
  let receitaId: number;

  beforeEach(async () => {
    const res = await request(app).post('/api/receitas').set('Authorization', autor.auth).send(novaReceita());
    receitaId = res.body.id;
  });

  it('autor edita a própria receita e os itens são substituídos', async () => {
    const res = await request(app)
      .put(`/api/receitas/${receitaId}`)
      .set('Authorization', autor.auth)
      .send({ ...novaReceita(), titulo: 'Panqueca doce', itens: [{ nome: 'banana', quantidade: 2 }] });
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Panqueca doce');
    expect(res.body.itens).toHaveLength(1);
  });

  it('usuário não edita nem exclui receita alheia (403)', async () => {
    const put = await request(app).put(`/api/receitas/${receitaId}`).set('Authorization', outro.auth).send(novaReceita());
    const del = await request(app).delete(`/api/receitas/${receitaId}`).set('Authorization', outro.auth);
    expect(put.status).toBe(403);
    expect(del.status).toBe(403);
  });

  it('Admin edita e exclui qualquer receita, e os itens vão junto', async () => {
    const put = await request(app)
      .put(`/api/receitas/${receitaId}`)
      .set('Authorization', admin.auth)
      .send({ ...novaReceita(), titulo: 'Editada pelo admin' });
    expect(put.status).toBe(200);

    const del = await request(app).delete(`/api/receitas/${receitaId}`).set('Authorization', admin.auth);
    expect(del.status).toBe(204);
    expect(await ItemReceita.count({ where: { receitaId } })).toBe(0);
    expect((await request(app).get(`/api/receitas/${receitaId}`)).status).toBe(404);
  });
});

describe('UC03 FA05 — minhas receitas', () => {
  it('lista só as receitas do usuário logado', async () => {
    await request(app).post('/api/receitas').set('Authorization', outro.auth).send({ ...novaReceita(), titulo: 'Do outro' });
    const res = await request(app).get('/api/receitas/minhas').set('Authorization', outro.auth);
    expect(res.status).toBe(200);
    expect(res.body.map((r: { titulo: string }) => r.titulo)).toEqual(['Do outro']);
  });
});
