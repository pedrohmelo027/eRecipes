import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable(
    'item_receita',
    {
      receita_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'receita', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      ingrediente_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'ingrediente', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      quantidade: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      unidade: { type: DataTypes.STRING(30), allowNull: true },
    },
    { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  );
  await qi.addIndex('item_receita', ['ingrediente_id']);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable('item_receita');
};
