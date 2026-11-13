import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable(
    'usuario',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      senha_hash: { type: DataTypes.STRING(255), allowNull: false },
      tipo_usuario: {
        type: DataTypes.ENUM('USUARIO', 'ADMIN'),
        allowNull: false,
        defaultValue: 'USUARIO',
      },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  );
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable('usuario');
};
