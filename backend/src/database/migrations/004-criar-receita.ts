import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable(
    'receita',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: { type: DataTypes.STRING(150), allowNull: false },
      modo_preparo: { type: DataTypes.TEXT, allowNull: false },
      tempo_preparo: { type: DataTypes.INTEGER, allowNull: true },
      rendimento: { type: DataTypes.INTEGER, allowNull: true },
      foto_url: { type: DataTypes.STRING(255), allowNull: true },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'usuario', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'categoria', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      data_criacao: { type: DataTypes.DATE, allowNull: false },
      data_atualizacao: { type: DataTypes.DATE, allowNull: false },
    },
    { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  );
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable('receita');
};
