import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable(
    'categoria',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    },
  );
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable('categoria', {});
};
