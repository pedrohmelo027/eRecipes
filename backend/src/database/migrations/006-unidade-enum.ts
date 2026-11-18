import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';

const UNIDADES_MEDIDA = [
  'unidade', 'g', 'kg', 'mg', 'ml', 'litro', 'xícara', 'copo', 'colher de sopa', 'colher de chá',
  'colher de café', 'pitada', 'gota', 'dente', 'fatia', 'pedaço', 'folha', 'ramo', 'maço', 'pé',
  'lata', 'pacote', 'caixa', 'vidro', 'sachê', 'a gosto',
];

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.sequelize.query('UPDATE item_receita SET unidade = NULL WHERE unidade NOT IN (:unidades)', {
    replacements: { unidades: [...UNIDADES_MEDIDA] },
  });
  await qi.changeColumn('item_receita', 'unidade', {
    type: DataTypes.ENUM(...UNIDADES_MEDIDA),
    allowNull: true,
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.changeColumn('item_receita', 'unidade', { type: DataTypes.STRING(30), allowNull: true });
};
