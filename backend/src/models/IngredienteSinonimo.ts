import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { Ingrediente } from './Ingrediente';

export class IngredienteSinonimo extends Model<
  InferAttributes<IngredienteSinonimo>,
  InferCreationAttributes<IngredienteSinonimo>
> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare ingredienteId: ForeignKey<Ingrediente['id']>;

  declare ingrediente?: NonAttribute<Ingrediente>;
}

IngredienteSinonimo.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'ingrediente_sinonimo', timestamps: false },
);
