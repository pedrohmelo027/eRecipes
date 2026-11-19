import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';
import { COLLATION } from './003-criar-ingrediente';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable(
    'ingrediente_sinonimo',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: `VARCHAR(100) COLLATE ${COLLATION}`, allowNull: false, unique: true },
      ingrediente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ingrediente', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
  );
  await qi.addIndex('ingrediente_sinonimo', ['ingrediente_id']);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable('ingrediente_sinonimo', {});
};
