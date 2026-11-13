import {
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { Ingrediente } from './Ingrediente';
import type { Receita } from './Receita';

export class ItemReceita extends Model<InferAttributes<ItemReceita>, InferCreationAttributes<ItemReceita>> {
  declare receitaId: ForeignKey<Receita['id']>;
  declare ingredienteId: ForeignKey<Ingrediente['id']>;
  declare quantidade: number | null;
  declare unidade: string | null;

  declare ingrediente?: NonAttribute<Ingrediente>;
}

ItemReceita.init(
  {
    receitaId: { type: DataTypes.INTEGER, primaryKey: true },
    ingredienteId: { type: DataTypes.INTEGER, primaryKey: true },
    quantidade: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      get() {
        const valor = this.getDataValue('quantidade');
        return valor === null || valor === undefined ? null : Number(valor);
      },
    },
    unidade: { type: DataTypes.STRING(30), allowNull: true },
  },
  { sequelize, tableName: 'item_receita', timestamps: false },
);
