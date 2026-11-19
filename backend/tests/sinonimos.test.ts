import request from 'supertest';
import { app } from '../src/app';
import { Categoria, Ingrediente, IngredienteSinonimo, ItemReceita } from '../src/models';
import { criarIngredientes, criarReceita, criarUsuario, fecharBanco, resetarBanco } from './helpers';

let autor: Awaited<ReturnType<typeof criarUsuario>>;
let categoriaId: number;

const nomesDaReceita = async (id: number) =>
  (await request(app).get(`/api/receitas/${id}`)).body.itens.map((i: { ingrediente: { nome: string } }) => i.ingrediente.nome).sort();

beforeAll(async () => {
  await resetarBanco();
  autor = await criarUsuario();
  categoriaId = (await Categoria.findOne({ where: { nome: 'Lanches' } }))!.id;
  await Ingrediente.registrarSinonimo('aipim', 'mandioca');
  await Ingrediente.registrarSinonimo('macaxeira', 'mandioca');
});
afterAll(fecharBanco);

const cadastrar = (...nomes: string[]) =>
  request(app)
    .post('/api/receitas')
    .set('Authorization', autor.auth)
    .send({ titulo: 'Teste', categoriaId, modoPreparo: 'Faça.', itens: nomes.map((nome) => ({ nome })) });

describe('sinônimos de ingredientes', () => {
  it('grava o nome principal quando a receita usa um sinônimo', async () => {
    const res = await cadastrar('Aipim', 'sal');
    expect(res.status).toBe(201);
    expect(await nomesDaReceita(res.body.id)).toEqual(['mandioca', 'sal']);
  });

  it('reconhece o plural de um ingrediente já cadastrado', async () => {
    await criarIngredientes('ovo');
    const res = await cadastrar('Ovos', 'limões');
    expect(await nomesDaReceita(res.body.id)).toEqual(['limões', 'ovo']);
    const outra = await cadastrar('limão');
    expect(await nomesDaReceita(outra.body.id)).toEqual(['limões']);
  });

  it('acha pelo sinônimo no autocompletar', async () => {
    const res = await request(app).get('/api/ingredientes?q=macax');
    expect(res.body.map((i: { nome: string }) => i.nome)).toEqual(['mandioca']);
  });

  it('ignora acentos e maiúsculas no autocompletar e no cadastro', async () => {
    const [acucar] = await criarIngredientes('açúcar mascavo');
    const res = await request(app).get('/api/ingredientes?q=ACUCAR');
    expect(res.body.map((i: { nome: string }) => i.nome)).toEqual(['açúcar mascavo']);
    expect((await Ingrediente.obterOuCriar('Acucar Mascavo')).id).toBe(acucar.id);
  });

  it('trata % e _ como texto comum no autocompletar', async () => {
    const res = await request(app).get('/api/ingredientes?q=%25');
    expect(res.body).toEqual([]);
  });

  it('mostra os sinônimos nos ingredientes disponíveis para a busca', async () => {
    const res = await request(app).get('/api/ingredientes/disponiveis');
    expect(res.body.find((i: { nome: string }) => i.nome === 'mandioca').sinonimos).toEqual(['aipim', 'macaxeira']);
  });

  it('a busca pelo ingrediente principal acha receitas cadastradas com o sinônimo', async () => {
    const mandioca = await Ingrediente.findOne({ where: { nome: 'mandioca' } });
    const res = await request(app)
      .get(`/api/receitas/busca?ingredientes=${mandioca!.id}`)
      .set('Authorization', autor.auth);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('unifica um ingrediente duplicado ao registrar o sinônimo', async () => {
    const [farinha, trigo, ovo] = await criarIngredientes('farinha de trigo', 'trigo', 'ovo');
    const soTrigo = await criarReceita(autor.usuario.id, [trigo, ovo], { titulo: 'Só trigo' });
    const ambos = await criarReceita(autor.usuario.id, [trigo, farinha], { titulo: 'Os dois' });

    await Ingrediente.registrarSinonimo('trigo', 'farinha de trigo');

    expect(await Ingrediente.findOne({ where: { nome: 'trigo' } })).toBeNull();
    expect((await IngredienteSinonimo.findOne({ where: { nome: 'trigo' } }))!.ingredienteId).toBe(farinha.id);
    expect(await nomesDaReceita(soTrigo.id)).toEqual(['farinha de trigo', 'ovo']);
    expect(await ItemReceita.count({ where: { receitaId: ambos.id } })).toBe(1);
  });
});
