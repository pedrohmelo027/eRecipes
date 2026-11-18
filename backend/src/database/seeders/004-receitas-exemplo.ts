import type { MigrationFn } from 'umzug';
import type { Sequelize } from 'sequelize';
import { env } from '../../config/env';
import { Categoria, Ingrediente, ItemReceita, Receita, Usuario } from '../../models';
import { Unidade } from '../../models/Unidade';

interface ReceitaExemplo {
  titulo: string;
  categoria: string;
  modoPreparo: string;
  tempoPreparo: number;
  rendimento: number;
  itens: [nome: string, quantidade: number | null, unidade: Unidade | null][];
}

const EXEMPLOS: ReceitaExemplo[] = [
  {
    titulo: 'Omelete simples',
    categoria: 'Lanches',
    tempoPreparo: 10,
    rendimento: 1,
    modoPreparo:
      'Bata os ovos com uma pitada de sal. Aqueça a manteiga em uma frigideira, despeje os ovos e cozinhe em fogo baixo até firmar. Dobre ao meio e sirva.',
    itens: [['ovo', 3, Unidade.UNIDADE], ['sal', null, null], ['manteiga', 15, Unidade.G]],
  },
  {
    titulo: 'Bolo de chocolate',
    categoria: 'Bolos',
    tempoPreparo: 50,
    rendimento: 12,
    modoPreparo:
      'Bata os ovos, o açúcar e o óleo. Acrescente o leite, a farinha e o chocolate em pó. Por último, misture o fermento. Asse em forma untada a 180 °C por cerca de 40 minutos.',
    itens: [
      ['ovo', 3, Unidade.UNIDADE], ['açúcar', 2, Unidade.XICARA], ['óleo', 0.5, Unidade.XICARA],
      ['leite', 1, Unidade.XICARA], ['farinha de trigo', 2, Unidade.XICARA],
      ['chocolate em pó', 1, Unidade.XICARA], ['fermento em pó', 15, Unidade.G],
    ],
  },
  {
    titulo: 'Arroz branco',
    categoria: 'Pratos principais',
    tempoPreparo: 25,
    rendimento: 4,
    modoPreparo:
      'Refogue o alho e a cebola no óleo. Junte o arroz e frite por 2 minutos. Adicione água fervente e sal, tampe e cozinhe em fogo baixo até secar.',
    itens: [
      ['arroz', 2, Unidade.XICARA], ['água', 4, Unidade.XICARA], ['alho', 2, Unidade.UNIDADE],
      ['cebola', 0.5, Unidade.UNIDADE], ['óleo', 30, Unidade.ML], ['sal', 5, Unidade.G],
    ],
  },
  {
    titulo: 'Macarrão ao sugo',
    categoria: 'Massas',
    tempoPreparo: 20,
    rendimento: 3,
    modoPreparo:
      'Cozinhe o macarrão em água com sal. Refogue o alho no azeite, adicione o molho de tomate e deixe apurar. Misture ao macarrão escorrido.',
    itens: [
      ['macarrão', 500, Unidade.G], ['molho de tomate', 340, Unidade.G], ['alho', 2, Unidade.UNIDADE],
      ['azeite', 30, Unidade.ML], ['sal', null, null], ['água', 3, Unidade.L],
    ],
  },
  {
    titulo: 'Salada de alface e tomate',
    categoria: 'Saladas',
    tempoPreparo: 10,
    rendimento: 2,
    modoPreparo: 'Lave e corte a alface e o tomate. Tempere com azeite, limão e sal.',
    itens: [
      ['alface', 1, Unidade.UNIDADE], ['tomate', 2, Unidade.UNIDADE], ['azeite', 15, Unidade.ML],
      ['limão', 0.5, Unidade.UNIDADE], ['sal', null, null],
    ],
  },
  {
    titulo: 'Vitamina de banana',
    categoria: 'Bebidas',
    tempoPreparo: 5,
    rendimento: 2,
    modoPreparo: 'Bata no liquidificador a banana, o leite e o açúcar até ficar homogêneo.',
    itens: [['banana', 2, Unidade.UNIDADE], ['leite', 2, Unidade.XICARA], ['açúcar', 15, Unidade.G]],
  },
];

export const up: MigrationFn<Sequelize> = async ({ context: sequelize }) => {
  const autor = await Usuario.findOne({ where: { email: env.admin.email?.toLowerCase() } });
  if (!autor) throw new Error('Admin inicial não encontrado; rode o seed 003-admin antes');

  await sequelize.transaction(async (transaction) => {
    for (const exemplo of EXEMPLOS) {
      const jaExiste = await Receita.findOne({ where: { titulo: exemplo.titulo }, transaction });
      if (jaExiste) continue;

      const categoria = await Categoria.findOne({ where: { nome: exemplo.categoria }, transaction });
      const receita = await Receita.create(
        {
          titulo: exemplo.titulo,
          modoPreparo: exemplo.modoPreparo,
          tempoPreparo: exemplo.tempoPreparo,
          rendimento: exemplo.rendimento,
          fotoUrl: null,
          usuarioId: autor.id,
          categoriaId: categoria!.id,
        },
        { transaction },
      );
      for (const [nome, quantidade, unidade] of exemplo.itens) {
        const ingrediente = await Ingrediente.obterOuCriar(nome, transaction);
        await ItemReceita.create(
          { receitaId: receita.id, ingredienteId: ingrediente.id, quantidade, unidade },
          { transaction },
        );
      }
    }
  });
};

export const down: MigrationFn<Sequelize> = async () => {
  await Receita.destroy({ where: { titulo: EXEMPLOS.map((e) => e.titulo) } });
};
