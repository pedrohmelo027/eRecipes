import bcrypt from 'bcryptjs';
import { criarBanco } from '../src/database/criarBanco';
import { migrator } from '../src/database/migrator';
import { CATEGORIAS } from '../src/database/seeders/001-categorias';
import { Categoria, Ingrediente, ItemReceita, Receita, sequelize, TipoUsuario, Usuario } from '../src/models';
import { AuthService } from '../src/services/AuthService';
import { Unidade } from '../src/models/Unidade';

export async function resetarBanco() {
  await criarBanco();
  await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrator.up();
  await Categoria.bulkCreate(CATEGORIAS.map((nome) => ({ nome })));
}

export async function fecharBanco() {
  await sequelize.close();
}

let contador = 0;

export async function criarUsuario(
  opcoes: { tipoUsuario?: TipoUsuario; ativo?: boolean; senha?: string } = {},
) {
  contador += 1;
  const usuario = await Usuario.create({
    nome: `Usuário ${contador}`,
    email: `usuario${contador}@teste.com`,
    senhaHash: await bcrypt.hash(opcoes.senha ?? 'senha12345', 4),
    tipoUsuario: opcoes.tipoUsuario ?? TipoUsuario.USUARIO,
    ativo: opcoes.ativo ?? true,
  });
  return { usuario, token: AuthService.gerarToken(usuario), auth: `Bearer ${AuthService.gerarToken(usuario)}` };
}

export async function criarIngredientes(...nomes: string[]) {
  return Promise.all(nomes.map((nome) => Ingrediente.obterOuCriar(nome)));
}

export async function criarReceita(
  autorId: number,
  ingredientes: Ingrediente[],
  opcoes: { titulo?: string; categoria?: string } = {},
) {
  const categoria = await Categoria.findOne({ where: { nome: opcoes.categoria ?? 'Lanches' } });
  const receita = await Receita.create({
    titulo: opcoes.titulo ?? 'Receita de teste',
    modoPreparo: 'Misture tudo.',
    tempoPreparo: 10,
    rendimento: 2,
    fotoUrl: null,
    usuarioId: autorId,
    categoriaId: categoria!.id,
  });
  await ItemReceita.bulkCreate(
    ingredientes.map((i) => ({ receitaId: receita.id, ingredienteId: i.id, quantidade: 1, unidade: Unidade.UNIDADE })),
  );
  return receita;
}
