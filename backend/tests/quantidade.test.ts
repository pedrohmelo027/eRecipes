import request from 'supertest';
import { app } from '../src/app';
import { Categoria } from '../src/models';
import { converterQuantidade } from '../src/utils/quantidade';
import { criarUsuario, fecharBanco, resetarBanco } from './helpers';

describe('converterQuantidade', () => {
  it.each([
    ['2', 2],
    ['1,5', 1.5],
    ['0.5', 0.5],
    ['1/2', 0.5],
    ['1 / 4', 0.25],
    ['3/4', 0.75],
    ['1 1/2', 1.5],
    ['1 e 1/2', 1.5],
    ['2 e meia', 2.5],
    ['½', 0.5],
    ['1½', 1.5],
    ['meia', 0.5],
    ['Meio', 0.5],
  ])('"%s" → %d', (texto, esperado) => {
    expect(converterQuantidade(texto)).toBeCloseTo(esperado);
  });

  it.each(['abc', '1/0', '1//2', '-1', ''])('"%s" é inválido', (texto) => {
    expect(converterQuantidade(texto)).toBeNaN();
  });
});

describe('quantidade fracionada na receita', () => {
  let autor: Awaited<ReturnType<typeof criarUsuario>>;
  let categoriaId: number;

  beforeAll(async () => {
    await resetarBanco();
    autor = await criarUsuario();
    categoriaId = (await Categoria.findOne({ where: { nome: 'Bolos' } }))!.id;
  });
  afterAll(fecharBanco);

  const cadastrar = (itens: { nome: string; quantidade: unknown; unidade?: string }[]) =>
    request(app)
      .post('/api/receitas')
      .set('Authorization', autor.auth)
      .send({ titulo: 'Bolo', categoriaId, modoPreparo: 'Asse.', itens });

  it('grava 1/2, 1 1/2, meia e 1/3 com o valor certo', async () => {
    const res = await cadastrar([
      { nome: 'leite', quantidade: '1/2', unidade: 'xícara' },
      { nome: 'farinha de trigo', quantidade: '1 1/2', unidade: 'xícara' },
      { nome: 'cebola', quantidade: 'meia', unidade: 'unidade' },
      { nome: 'açúcar', quantidade: '1/3', unidade: 'xícara' },
      { nome: 'ovo', quantidade: 2, unidade: 'unidade' },
    ]);
    expect(res.status).toBe(201);
    const qtd = Object.fromEntries(
      res.body.itens.map((i: { ingrediente: { nome: string }; quantidade: number }) => [i.ingrediente.nome, i.quantidade]),
    );
    expect(qtd).toEqual({ leite: 0.5, 'farinha de trigo': 1.5, cebola: 0.5, açúcar: 0.33, ovo: 2 });
  });

  it('avisa quando a quantidade não é entendida, em vez de salvar vazia', async () => {
    const res = await cadastrar([{ nome: 'leite', quantidade: 'um pouco', unidade: 'xícara' }]);
    expect(res.status).toBe(400);
    expect(res.body.campos['itens.0.quantidade']).toMatch(/Quantidade inválida/);
  });

  it('aceita quantidade vazia (ex.: sal a gosto)', async () => {
    const res = await cadastrar([{ nome: 'sal', quantidade: '', unidade: 'a gosto' }]);
    expect(res.status).toBe(201);
    expect(res.body.itens[0].quantidade).toBeNull();
  });
});
