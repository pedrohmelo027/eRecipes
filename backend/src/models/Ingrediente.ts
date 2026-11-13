import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Op,
  Transaction,
} from 'sequelize';
import { sequelize } from '../config/database';
import { normalizarNomeIngrediente } from '../utils/normalizar';

export class Ingrediente extends Model<InferAttributes<Ingrediente>, InferCreationAttributes<Ingrediente>> {
  declare id: CreationOptional<number>;
  declare nome: string;

  static async obterOuCriar(nome: string, transaction?: Transaction): Promise<Ingrediente> {
    const nomeNormalizado = normalizarNomeIngrediente(nome);
    const [ingrediente] = await Ingrediente.findOrCreate({
      where: { nome: nomeNormalizado },
      defaults: { nome: nomeNormalizado },
      transaction,
    });
    return ingrediente;
  }

  static pesquisar(termo: string | undefined, limite = 20) {
    if (!termo) return Ingrediente.findAll({ order: [['nome', 'ASC']], limit: limite });

    const normalizado = normalizarNomeIngrediente(termo);
    const escapado = normalizado.replace(/[\\%_]/g, (c) => `\\${c}`);
    const relevancia = sequelize.literal(
      `CASE WHEN nome = ${sequelize.escape(normalizado)} THEN 0
            WHEN nome LIKE ${sequelize.escape(`${escapado}%`)} THEN 1
            ELSE 2 END`,
    );
    return Ingrediente.findAll({
      where: { nome: { [Op.like]: `%${escapado}%` } },
      order: [relevancia, ['nome', 'ASC']],
      limit: limite,
    });
  }
}

Ingrediente.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'ingrediente', timestamps: false },
);
