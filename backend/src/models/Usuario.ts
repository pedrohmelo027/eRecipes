import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';

export enum TipoUsuario {
  USUARIO = 'USUARIO',
  ADMIN = 'ADMIN',
}

export class Usuario extends Model<InferAttributes<Usuario>, InferCreationAttributes<Usuario>> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare email: string;
  declare senhaHash: string;
  declare tipoUsuario: CreationOptional<TipoUsuario>;
  declare ativo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  get ehAdmin(): NonAttribute<boolean> {
    return this.tipoUsuario === TipoUsuario.ADMIN;
  }

  toJSON() {
    const { senhaHash: _omitido, ...resto } = this.get({ plain: true }) as InferAttributes<Usuario>;
    return resto;
  }
}

Usuario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    senhaHash: { type: DataTypes.STRING(255), allowNull: false },
    tipoUsuario: {
      type: DataTypes.ENUM(...Object.values(TipoUsuario)),
      allowNull: false,
      defaultValue: TipoUsuario.USUARIO,
    },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'usuario',
    defaultScope: { attributes: { exclude: ['senhaHash'] } },
    scopes: { comSenha: { attributes: { include: ['senhaHash'] } } },
  },
);
