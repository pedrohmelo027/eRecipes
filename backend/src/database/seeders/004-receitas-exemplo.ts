import type { MigrationFn } from 'umzug';
import type { Sequelize } from 'sequelize';
import { env } from '../../config/env';
import { Categoria, Ingrediente, ItemReceita, Receita, Usuario } from '../../models';

interface ReceitaExemplo {
  titulo: string;
  categoria: string;
  modoPreparo: string;
  tempoPreparo: number;
  rendimento: number;
  itens: [nome: string, quantidade: number | null, unidade: string | null][];
}

const EXEMPLOS: ReceitaExemplo[] = [
  {
    titulo: 'Omelete simples',
    categoria: 'Lanches',
    tempoPreparo: 10,
    rendimento: 1,
    modoPreparo:
      'Bata os ovos com uma pitada de sal. Aqueça a manteiga em uma frigideira, despeje os ovos e cozinhe em fogo baixo até firmar. Dobre ao meio e sirva.',
    itens: [['ovo', 3, 'unidade'], ['sal', null, 'a gosto'], ['manteiga', 1, 'colher de sopa']],
  },
  {
    titulo: 'Bolo de chocolate',
    categoria: 'Bolos',
    tempoPreparo: 50,
    rendimento: 12,
    modoPreparo:
      'Bata os ovos, o açúcar e o óleo. Acrescente o leite, a farinha e o chocolate em pó. Por último, misture o fermento. Asse em forma untada a 180 °C por cerca de 40 minutos.',
    itens: [
      ['ovo', 3, 'unidade'], ['açúcar', 2, 'xícara'], ['óleo', 0.5, 'xícara'],
      ['leite', 1, 'xícara'], ['farinha de trigo', 2, 'xícara'],
      ['chocolate em pó', 1, 'xícara'], ['fermento em pó', 1, 'colher de sopa'],
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
      ['arroz', 2, 'xícara'], ['água', 4, 'xícara'], ['alho', 2, 'dente'],
      ['cebola', 0.5, 'unidade'], ['óleo', 2, 'colher de sopa'], ['sal', 1, 'colher de chá'],
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
      ['macarrão', 500, 'g'], ['molho de tomate', 1, 'lata'], ['alho', 2, 'dente'],
      ['azeite', 2, 'colher de sopa'], ['sal', null, 'a gosto'], ['água', 3, 'litro'],
    ],
  },
  {
    titulo: 'Salada de alface e tomate',
    categoria: 'Saladas',
    tempoPreparo: 10,
    rendimento: 2,
    modoPreparo: 'Lave e corte a alface e o tomate. Tempere com azeite, limão e sal.',
    itens: [
      ['alface', 1, 'pé'], ['tomate', 2, 'unidade'], ['azeite', 1, 'colher de sopa'],
      ['limão', 0.5, 'unidade'], ['sal', null, 'a gosto'],
    ],
  },
  {
    titulo: 'Vitamina de banana',
    categoria: 'Bebidas',
    tempoPreparo: 5,
    rendimento: 2,
    modoPreparo: 'Bata no liquidificador a banana, o leite e o açúcar até ficar homogêneo.',
    itens: [['banana', 2, 'unidade'], ['leite', 2, 'xícara'], ['açúcar', 1, 'colher de sopa']],
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
