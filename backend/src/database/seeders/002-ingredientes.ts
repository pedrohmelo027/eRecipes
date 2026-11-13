import type { MigrationFn } from 'umzug';
import type { Sequelize } from 'sequelize';
import { Ingrediente } from '../../models';
import { normalizarNomeIngrediente } from '../../utils/normalizar';

export const INGREDIENTES = [
  'ovo', 'leite', 'açúcar', 'farinha de trigo', 'arroz', 'feijão', 'tomate', 'cebola',
  'alho', 'frango', 'carne moída', 'batata', 'cenoura', 'manteiga', 'óleo', 'sal',
  'fermento em pó', 'chocolate em pó', 'queijo', 'presunto', 'pão', 'macarrão',
  'molho de tomate', 'creme de leite', 'leite condensado', 'limão', 'banana', 'alface',
  'azeite', 'pimenta-do-reino', 'água', 'milho', 'ervilha', 'atum', 'maionese',
];

export const up: MigrationFn<Sequelize> = async () => {
  await Ingrediente.bulkCreate(
    INGREDIENTES.map((nome) => ({ nome: normalizarNomeIngrediente(nome) })),
    { ignoreDuplicates: true },
  );
};

export const down: MigrationFn<Sequelize> = async () => {};
