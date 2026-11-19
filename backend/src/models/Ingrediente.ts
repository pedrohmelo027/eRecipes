import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  QueryTypes,
  Transaction,
} from 'sequelize';
import { sequelize } from '../config/database';
import { formasPlurais, formasSingulares, normalizarNomeIngrediente } from '../utils/normalizar';
import { Sinonimo, SINONIMOS_TIPOS } from './Sinonimo';

export interface IngredienteDisponivel {
  id: number;
  nome: string;
  sinonimos: string[];
}

// Dois ingredientes são sinônimos quando estão no mesmo grupo. O grupo é identificado pelo id do
// ingrediente a que os outros apontam (sinonimo_id); esse ingrediente é só a ligação, não um nome principal.
const GRUPO = (tabela: string) => `COALESCE(${tabela}.sinonimo_id, ${tabela}.id)`;

export class Ingrediente extends Model<InferAttributes<Ingrediente>, InferCreationAttributes<Ingrediente>> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare tipo: CreationOptional<Sinonimo>;
  declare sinonimoId: ForeignKey<Ingrediente['id']> | null;

  declare sinonimo?: NonAttribute<Ingrediente>;

  static async resolver(nome: string, transaction?: Transaction): Promise<Ingrediente | null> {
    const normalizado = normalizarNomeIngrediente(nome);
    for (const candidato of [normalizado, ...formasSingulares(normalizado), ...formasPlurais(normalizado)]) {
      const ingrediente = await Ingrediente.findOne({ where: { nome: candidato }, transaction });
      if (ingrediente) return ingrediente;
    }
    return null;
  }

  static async obterOuCriar(nome: string, transaction?: Transaction): Promise<Ingrediente> {
    const existente = await Ingrediente.resolver(nome, transaction);
    if (existente) return existente;
    const nomeNormalizado = normalizarNomeIngrediente(nome);
    const [ingrediente] = await Ingrediente.findOrCreate({
      where: { nome: nomeNormalizado },
      defaults: { nome: nomeNormalizado },
      transaction,
    });
    return ingrediente;
  }

  /** Marca os dois ingredientes (criando-os se preciso) como sinônimos, juntando os grupos de cada um. */
  static async registrarSinonimo(nome: string, outro: string, transaction?: Transaction): Promise<void> {
    const a = await Ingrediente.obterOuCriar(nome, transaction);
    const b = await Ingrediente.obterOuCriar(outro, transaction);
    const grupoA = a.sinonimoId ?? a.id;
    const grupoB = b.sinonimoId ?? b.id;
    if (grupoA === grupoB) return;

    await sequelize.query(
      `UPDATE ingrediente SET sinonimo_id = :grupoA, tipo = :tipo WHERE id = :grupoB OR sinonimo_id = :grupoB`,
      { replacements: { grupoA, grupoB, tipo: Sinonimo.SINONIMO }, transaction },
    );
    await sequelize.query('UPDATE ingrediente SET tipo = :tipo WHERE id = :grupoA', {
      replacements: { grupoA, tipo: Sinonimo.SINONIMO },
      transaction,
    });
  }

  /** Os ids informados mais os de todos os seus sinônimos. */
  static async comSinonimos(ids: number[], transaction?: Transaction): Promise<number[]> {
    if (!ids.length) return [];
    const linhas = await sequelize.query<{ id: number }>(
      `SELECT DISTINCT g.id FROM ingrediente i
         JOIN ingrediente g ON ${GRUPO('g')} = ${GRUPO('i')}
        WHERE i.id IN (:ids)`,
      { replacements: { ids }, type: QueryTypes.SELECT, transaction },
    );
    return linhas.map((l) => l.id);
  }

  static async disponiveis(): Promise<IngredienteDisponivel[]> {
    const linhas = await sequelize.query<{ id: number; nome: string }>(
      `SELECT DISTINCT i.id, i.nome FROM ingrediente i
         JOIN item_receita ir ON ir.ingrediente_id = i.id
         JOIN receita r ON r.id = ir.receita_id
         JOIN usuario u ON u.id = r.usuario_id AND u.ativo = TRUE
        ORDER BY i.nome ASC`,
      { type: QueryTypes.SELECT },
    );
    if (!linhas.length) return [];

    const sinonimos = await sequelize.query<{ id: number; nome: string }>(
      `SELECT i.id, g.nome FROM ingrediente i
         JOIN ingrediente g ON ${GRUPO('g')} = ${GRUPO('i')} AND g.id <> i.id
        WHERE i.id IN (:ids) AND i.tipo = :tipo
        ORDER BY g.nome ASC`,
      { replacements: { ids: linhas.map((l) => l.id), tipo: Sinonimo.SINONIMO }, type: QueryTypes.SELECT },
    );
    return linhas.map((l) => ({
      id: l.id,
      nome: l.nome,
      sinonimos: sinonimos.filter((s) => s.id === l.id).map((s) => s.nome),
    }));
  }

  static pesquisar(termo: string | undefined, limite = 20) {
    if (!termo) return Ingrediente.findAll({ order: [['nome', 'ASC']], limit: limite });

    // A coluna nome usa a collation ci_ai (ignora maiúsculas/acentos), que não aceita LIKE;
    // por isso o trecho é comparado sem acento com ILIKE sobre a collation "C".
    const normalizado = normalizarNomeIngrediente(termo);
    const escapado = normalizado.replace(/[\\%_]/g, (c) => `\\${c}`);
    return Ingrediente.findAll({
      where: sequelize.literal(`unaccent(nome COLLATE "C") ILIKE unaccent(:contem)`),
      order: [
        sequelize.literal(
          `CASE WHEN nome = :exato THEN 0
                WHEN unaccent(nome COLLATE "C") ILIKE unaccent(:comeca) THEN 1
                ELSE 2 END`,
        ),
        ['nome', 'ASC'],
      ],
      replacements: { exato: normalizado, contem: `%${escapado}%`, comeca: `${escapado}%` },
      limit: limite,
    });
  }
}

Ingrediente.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    tipo: { type: DataTypes.ENUM(...SINONIMOS_TIPOS), allowNull: false, defaultValue: Sinonimo.PADRAO },
    sinonimoId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'ingrediente', timestamps: false },
);
