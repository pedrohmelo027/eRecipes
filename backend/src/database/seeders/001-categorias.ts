import type { MigrationFn } from 'umzug';
import type { Sequelize } from 'sequelize';
import { Categoria } from '../../models';

export const CATEGORIAS = [
  'Entradas',
  'Pratos principais',
  'Massas',
  'Sobremesas',
  'Bolos',
  'Bebidas',
  'Lanches',
  'Saladas',
];

export const up: MigrationFn<Sequelize> = async () => {
  await Categoria.bulkCreate(
    CATEGORIAS.map((nome) => ({ nome })),
    { ignoreDuplicates: true },
  );
};

export const down: MigrationFn<Sequelize> = async () => {
  await Categoria.destroy({ where: { nome: CATEGORIAS } });
};
