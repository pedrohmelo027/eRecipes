import request from 'supertest';
import { app } from '../src/app';
import { Categoria, Ingrediente, Sinonimo } from '../src/models';
import { criarIngredientes, criarReceita, criarUsuario, fecharBanco, resetarBanco } from './helpers';

let autor: Awaited<ReturnType<typeof criarUsuario>>;
let categoriaId: number;

const nomesDaReceita = async (id: number) =>
  (await request(app).get(`/api/receitas/${id}`)).body.itens.map((i: { ingrediente: { nome: string } }) => i.ingrediente.nome).sort();

const porNome = async (nome: string) => (await Ingrediente.findOne({ where: { nome } }))!;

beforeAll(async () => {
  await resetarBanco();
  autor = await criarUsuario();
  categoriaId = (await Categoria.findOne({ where: { nome: 'Lanches' } }))!.id;
  await Ingrediente.registrarSinonimo('mandioca', 'aipim');
  await Ingrediente.registrarSinonimo('macaxeira', 'aipim');
});
afterAll(fecharBanco);

const cadastrar = (...nomes: string[]) =>
  request(app)
    .post('/api/receitas')
    .set('Authorization', autor.auth)
    .send({ titulo: 'Teste', categoriaId, modoPreparo: 'Faça.', itens: nomes.map((nome) => ({ nome })) });

const buscar = (...ids: number[]) =>
  request(app).get(`/api/receitas/busca?ingredientes=${ids.join(',')}`).set('Authorization', autor.auth);

describe('sinônimos de ingredientes (auto-associação)', () => {
  it('cada sinônimo é um ingrediente marcado como SINONIMO e ligado ao mesmo grupo', async () => {
    const [mandioca, aipim, macaxeira] = await Promise.all(['mandioca', 'aipim', 'macaxeira'].map(porNome));
    for (const i of [mandioca, aipim, macaxeira]) expect(i.tipo).toBe(Sinonimo.SINONIMO);
    const grupos = new Set([mandioca, aipim, macaxeira].map((i) => i.sinonimoId ?? i.id));
    expect(grupos.size).toBe(1);
    expect(await Ingrediente.comSinonimos([macaxeira.id])).toEqual(
      expect.arrayContaining([mandioca.id, aipim.id, macaxeira.id]),
    );
  });

  it('ingrediente sem sinônimos fica como PADRAO', async () => {
    const [sal] = await criarIngredientes('sal');
    expect(sal.tipo).toBe(Sinonimo.PADRAO);
    expect(sal.sinonimoId).toBeNull();
  });

  it('a receita mantém o nome que o autor usou', async () => {
    const res = await cadastrar('Aipim', 'sal');
    expect(res.status).toBe(201);
    expect(await nomesDaReceita(res.body.id)).toEqual(['aipim', 'sal']);
  });

  it('reconhece o plural de um ingrediente já cadastrado', async () => {
    await criarIngredientes('ovo');
    const res = await cadastrar('Ovos', 'limões');
    expect(await nomesDaReceita(res.body.id)).toEqual(['limões', 'ovo']);
    const outra = await cadastrar('limão');
    expect(await nomesDaReceita(outra.body.id)).toEqual(['limões']);
  });

  it('acha o sinônimo pelo próprio nome no autocompletar', async () => {
    const res = await request(app).get('/api/ingredientes?q=macax');
    expect(res.body.map((i: { nome: string }) => i.nome)).toEqual(['macaxeira']);
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

  it('mostra os outros nomes do grupo nos ingredientes disponíveis para a busca', async () => {
    const res = await request(app).get('/api/ingredientes/disponiveis');
    const aipim = res.body.find((i: { nome: string }) => i.nome === 'aipim');
    expect(aipim.sinonimos).toEqual(['macaxeira', 'mandioca']);
    expect(res.body.find((i: { nome: string }) => i.nome === 'sal').sinonimos).toEqual([]);
  });

  it('buscar por um nome acha receitas cadastradas com qualquer sinônimo, sem marcá-lo como faltando', async () => {
    const mandioca = await porNome('mandioca');
    const sal = await porNome('sal');
    const res = await buscar(mandioca.id, sal.id);
    const receita = res.body.find((r: { itens: { ingrediente: { nome: string } }[] }) =>
      r.itens.some((i) => i.ingrediente.nome === 'aipim'),
    );
    expect(receita).toBeDefined();
    expect(receita.ingredientesFaltando).toEqual([]);
  });

  it('registrar sinônimo entre ingredientes já usados mantém os dois nomes nas receitas', async () => {
    const [farinha, trigo, ovo] = await criarIngredientes('farinha de trigo', 'trigo', 'ovo');
    const soTrigo = await criarReceita(autor.usuario.id, [trigo, ovo], { titulo: 'Só trigo' });

    await Ingrediente.registrarSinonimo('trigo', 'farinha de trigo');

    expect(await nomesDaReceita(soTrigo.id)).toEqual(['ovo', 'trigo']);
    const res = await buscar(farinha.id, ovo.id);
    const achada = res.body.find((r: { id: number }) => r.id === soTrigo.id);
    expect(achada.ingredientesFaltando).toEqual([]);
  });

  it('junta dois grupos de sinônimos num só', async () => {
    await Ingrediente.registrarSinonimo('tangerina', 'mexerica');
    await Ingrediente.registrarSinonimo('bergamota', 'mimosa');
    await Ingrediente.registrarSinonimo('mexerica', 'bergamota');
    const ids = await Promise.all(['tangerina', 'mexerica', 'bergamota', 'mimosa'].map(async (n) => (await porNome(n)).id));
    expect((await Ingrediente.comSinonimos([ids[0]])).sort()).toEqual([...ids].sort());
  });
});
