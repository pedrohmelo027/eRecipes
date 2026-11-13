import request from 'supertest';
import { app } from '../src/app';
import { Categoria } from '../src/models';
import { criarIngredientes, criarReceita, criarUsuario, fecharBanco, resetarBanco } from './helpers';

let auth: string;
let ids: Record<string, number>;

beforeAll(async () => {
  await resetarBanco();
  const autor = await criarUsuario();
  const inativo = await criarUsuario({ ativo: false });
  auth = autor.auth;

  const [ovo, leite, farinha, acucar, sal] = await criarIngredientes('ovo', 'leite', 'farinha de trigo', 'açúcar', 'sal');
  ids = { ovo: ovo.id, leite: leite.id, farinha: farinha.id, acucar: acucar.id, sal: sal.id };

  await criarReceita(autor.usuario.id, [ovo, sal], { titulo: 'Ovo cozido', categoria: 'Lanches' });
  await criarReceita(autor.usuario.id, [ovo, leite, farinha, acucar], { titulo: 'Bolo', categoria: 'Bolos' });
  await criarReceita(inativo.usuario.id, [ovo], { titulo: 'Ovo do inativo', categoria: 'Lanches' });
});
afterAll(fecharBanco);

const buscar = (query: string) => request(app).get(`/api/receitas/busca?${query}`).set('Authorization', auth);
const titulos = (body: { titulo: string }[]) => body.map((r) => r.titulo).sort();

describe('RN06 — busca exata por ingredientes', () => {
  it('retorna receita quando todos os ingredientes estão na lista', async () => {
    const res = await buscar(`ingredientes=${ids.ovo},${ids.sal}`);
    expect(res.status).toBe(200);
    expect(titulos(res.body)).toEqual(['Ovo cozido']);
  });

  it('não retorna receita com 1 ingrediente faltando', async () => {
    const res = await buscar(`ingredientes=${ids.ovo},${ids.leite},${ids.farinha}`);
    expect(res.status).toBe(200);
    expect(titulos(res.body)).toEqual([]);
  });

  it('aceita ingredientes a mais na lista do usuário', async () => {
    const todos = Object.values(ids).join(',');
    const res = await buscar(`ingredientes=${todos}`);
    expect(titulos(res.body)).toEqual(['Bolo', 'Ovo cozido']);
  });

  it('traz categoria, autor e itens no resultado', async () => {
    const res = await buscar(`ingredientes=${ids.ovo},${ids.sal}`);
    expect(res.body[0].categoria.nome).toBe('Lanches');
    expect(res.body[0].autor).toHaveProperty('nome');
    expect(res.body[0].itens).toHaveLength(2);
  });
});

describe('RN07 — filtro por categoria', () => {
  it('filtra pela categoria informada', async () => {
    const bolos = await Categoria.findOne({ where: { nome: 'Bolos' } });
    const todos = Object.values(ids).join(',');
    const res = await buscar(`ingredientes=${todos}&categoria=${bolos!.id}`);
    expect(titulos(res.body)).toEqual(['Bolo']);
  });
});

describe('RN09 — autores inativos', () => {
  it('não retorna receitas de autor inativo', async () => {
    const res = await buscar(`ingredientes=${ids.ovo}`);
    expect(titulos(res.body)).not.toContain('Ovo do inativo');
  });

  it('não lista receitas de autor inativo na listagem pública', async () => {
    const res = await request(app).get('/api/receitas');
    expect(res.status).toBe(200);
    expect(titulos(res.body.dados)).toEqual(['Bolo', 'Ovo cozido']);
  });
});

describe('FE01 — validação da busca', () => {
  it('recusa busca sem ingredientes', async () => {
    expect((await buscar('ingredientes=')).status).toBe(400);
    expect((await buscar('')).status).toBe(400);
  });

  it('exige login para buscar', async () => {
    const res = await request(app).get(`/api/receitas/busca?ingredientes=${ids.ovo}`);
    expect(res.status).toBe(401);
  });
});
