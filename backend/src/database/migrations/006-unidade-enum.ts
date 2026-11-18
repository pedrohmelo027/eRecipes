import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';
import { UNIDADES_MEDIDA } from '../../models/UnidadeMedida';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  // Valores fora da lista viram NULL para não quebrar a conversão
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
