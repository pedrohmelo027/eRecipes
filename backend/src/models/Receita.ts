import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  Includeable,
  IncludeOptions,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import { AppError } from '../utils/AppError';
import type { Categoria } from './Categoria';
import type { ItemReceita } from './ItemReceita';
import type { Unidade } from './Unidade';
import type { Usuario } from './Usuario';

export interface DadosItemReceita {
  ingredienteId?: number;
  nome?: string;
  quantidade?: number | null;
  unidade?: Unidade | null;
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
   * getIngredientesByReceitas (diagrama de classes, RN06): retorna as receitas
   * que usam ao menos um dos ingredientes informados, filtrando pela categoria
   * quando ela é informada. Cada receita vem com `ingredientesFaltando`, e as
   * que dá para fazer só com o que o ator tem (nada faltando) vêm primeiro.
   * Receitas de autores inativos não aparecem (RN09).
   */
  static async getIngredientesByReceitas(ingredientes: number[], categoria?: number): Promise<ResultadoBusca[]> {
    if (!ingredientes.length) {
      throw new AppError(400, 'Informe ao menos um ingrediente', { ingredientes: 'Obrigatório' });
    }

    const itens = sequelize.models.ItemReceita as typeof ItemReceita;
    const usadas = await itens.findAll({
      attributes: ['receitaId'],
      where: { ingredienteId: ingredientes },
      group: ['receitaId'],
    });
    if (!usadas.length) return [];

    const receitas = await Receita.findAll({
      where: {
        id: usadas.map((item) => item.receitaId),
        ...(categoria ? { categoriaId: categoria } : {}),
      },
      include: Receita.includeCompleto.map((inc) =>
        (inc as IncludeOptions).as === 'autor' ? { ...(inc as IncludeOptions), where: { ativo: true } } : inc,
      ),
    });

    const disponiveis = new Set(ingredientes);
    return receitas
      .map((receita) => ({ ...receita.toJSON(), ingredientesFaltando: Receita.faltando(receita, disponiveis) }))
      .sort(
        (a, b) =>
          a.ingredientesFaltando.length - b.ingredientesFaltando.length ||
          a.titulo.localeCompare(b.titulo, 'pt-BR'),
      );
  }

  /** Nomes dos ingredientes da receita que não estão entre os disponíveis, em ordem alfabética. */
  private static faltando(receita: Receita, disponiveis: Set<number>): string[] {
    return (receita.itens ?? [])
      .filter((item) => !disponiveis.has(item.ingrediente!.id))
      .map((item) => item.ingrediente!.nome)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
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
