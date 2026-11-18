import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable(
    'ingrediente_sinonimo',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      ingrediente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ingrediente', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  );
  await qi.addIndex('ingrediente_sinonimo', ['ingrediente_id']);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable('ingrediente_sinonimo');
};
