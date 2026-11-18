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
import type { UnidadeMedida } from './UnidadeMedida';
import type { Usuario } from './Usuario';

export interface DadosItemReceita {
  ingredienteId?: number;
  nome?: string;
  quantidade?: number | null;
  unidade?: UnidadeMedida | null;
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

export type ResultadoBusca = InferAttributes<Receita> & { ingredientesFaltando: string[] };

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

  /**
   * Busca por ingredientes (RN06): retorna as receitas que usam ao menos um dos
   * ingredientes informados, com a lista do que falta. As que dá para fazer só
   * com o que o ator tem (nada faltando) vêm primeiro.
   */
  static async buscarPorIngredientes(ingredientes: number[], categoria?: number): Promise<ResultadoBusca[]> {
    if (!ingredientes.length) {
      throw new AppError(400, 'Informe ao menos um ingrediente', { ingredientes: 'Obrigatório' });
    }

    const linhas = await sequelize.query<{ id: number }>(
      `SELECT r.id FROM receita r
         JOIN usuario u ON u.id = r.usuario_id AND u.ativo = TRUE
         JOIN item_receita ir ON ir.receita_id = r.id
        WHERE (:categoria IS NULL OR r.categoria_id = :categoria)
        GROUP BY r.id
       HAVING SUM(ir.ingrediente_id IN (:ingredientes)) > 0`,
      {
        replacements: { ingredientes, categoria: categoria ?? null },
        type: QueryTypes.SELECT,
      },
    );
    if (!linhas.length) return [];

    const receitas = await Receita.findAll({
      where: { id: linhas.map((l) => l.id) },
      include: Receita.includeCompleto,
    });

    const tenho = new Set(ingredientes);
    return receitas
      .map((receita) => ({
        ...receita.toJSON(),
        ingredientesFaltando: (receita.itens ?? [])
          .filter((item) => !tenho.has(item.ingrediente!.id))
          .map((item) => item.ingrediente!.nome)
          .sort((x, y) => x.localeCompare(y, 'pt-BR')),
      }))
      .sort(
        (a, b) =>
          a.ingredientesFaltando.length - b.ingredientesFaltando.length ||
          a.titulo.localeCompare(b.titulo, 'pt-BR'),
      );
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
