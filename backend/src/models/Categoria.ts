import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Categoria extends Model<InferAttributes<Categoria>, InferCreationAttributes<Categoria>> {
  declare id: CreationOptional<number>;
  declare nome: string;
}

Categoria.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'categoria', timestamps: false },
);
