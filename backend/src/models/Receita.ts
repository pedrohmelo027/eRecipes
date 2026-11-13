import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  Includeable,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  QueryTypes,
} from 'sequelize';
import { sequelize } from '../config/database';
import { AppError } from '../utils/AppError';
import type { Categoria } from './Categoria';
import type { ItemReceita } from './ItemReceita';
import type { Usuario } from './Usuario';

export interface DadosItemReceita {
  ingredienteId?: number;
  nome?: string;
  quantidade?: number | null;
  unidade?: string | null;
}

export interface DadosReceita {
  titulo: string;
  categoriaId: number;
  modoPreparo: string;
  tempoPreparo?: number | null;
  rendimento?: number | null;
  fotoUrl?: string | null;
  itens: DadosItemReceita[];
}

export class Receita extends Model<InferAttributes<Receita>, InferCreationAttributes<Receita>> {
  declare id: CreationOptional<number>;
  declare titulo: string;
  declare modoPreparo: string;
  declare tempoPreparo: number | null;
  declare rendimento: number | null;
  declare fotoUrl: string | null;
  declare usuarioId: ForeignKey<Usuario['id']>;
  declare categoriaId: ForeignKey<Categoria['id']>;
  declare dataCriacao: CreationOptional<Date>;
  declare dataAtualizacao: CreationOptional<Date>;

  declare autor?: NonAttribute<Usuario>;
  declare categoria?: NonAttribute<Categoria>;
  declare itens?: NonAttribute<ItemReceita[]>;

  static includeCompleto: Includeable[] = [];

  static validar(dados: Partial<DadosReceita>): void {
    const campos: Record<string, string> = {};
    if (!dados.titulo?.trim()) campos.titulo = 'Informe o título';
    if (!dados.categoriaId) campos.categoriaId = 'Escolha uma categoria';
    if (!dados.modoPreparo?.trim()) campos.modoPreparo = 'Informe o modo de preparo';
    if (!dados.itens?.length) campos.itens = 'Informe ao menos um ingrediente';
    if (Object.keys(campos).length) {
      throw new AppError(400, 'Dados obrigatórios da receita ausentes', campos);
    }
  }

  static async buscarPorIngredientes(ingredientes: number[], categoria?: number): Promise<Receita[]> {
    if (!ingredientes.length) {
      throw new AppError(400, 'Informe ao menos um ingrediente', { ingredientes: 'Obrigatório' });
    }

    const linhas = await sequelize.query<{ id: number }>(
      `SELECT r.id FROM receita r
         JOIN usuario u ON u.id = r.usuario_id AND u.ativo = TRUE
        WHERE NOT EXISTS (
                SELECT 1 FROM item_receita ir
                 WHERE ir.receita_id = r.id
                   AND ir.ingrediente_id NOT IN (:ingredientes)
              )
          AND (:categoria IS NULL OR r.categoria_id = :categoria)`,
      {
        replacements: { ingredientes, categoria: categoria ?? null },
        type: QueryTypes.SELECT,
      },
    );
    if (!linhas.length) return [];

    return Receita.findAll({
      where: { id: linhas.map((l) => l.id) },
      include: Receita.includeCompleto,
      order: [['titulo', 'ASC']],
    });
  }
}

Receita.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    titulo: { type: DataTypes.STRING(150), allowNull: false },
    modoPreparo: { type: DataTypes.TEXT, allowNull: false },
    tempoPreparo: { type: DataTypes.INTEGER, allowNull: true },
    rendimento: { type: DataTypes.INTEGER, allowNull: true },
    fotoUrl: { type: DataTypes.STRING(255), allowNull: true },
    dataCriacao: DataTypes.DATE,
    dataAtualizacao: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'receita',
    createdAt: 'dataCriacao',
    updatedAt: 'dataAtualizacao',
  },
);
