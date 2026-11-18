import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Op,
  QueryTypes,
  Transaction,
} from 'sequelize';
import { sequelize } from '../config/database';
import { formasPlurais, formasSingulares, normalizarNomeIngrediente } from '../utils/normalizar';
import { IngredienteSinonimo } from './IngredienteSinonimo';

export interface IngredienteDisponivel {
  id: number;
  nome: string;
  sinonimos: string[];
}

export class Ingrediente extends Model<InferAttributes<Ingrediente>, InferCreationAttributes<Ingrediente>> {
  declare id: CreationOptional<number>;
  declare nome: string;

  declare sinonimos?: NonAttribute<IngredienteSinonimo[]>;

  /**
   * Encontra o ingrediente pelo nome principal, por um sinônimo ou pela forma
   * no singular/plural ("ovos" → "ovo"). Retorna null se não existir.
   */
  static async resolver(nome: string, transaction?: Transaction): Promise<Ingrediente | null> {
    const normalizado = normalizarNomeIngrediente(nome);
    for (const candidato of [normalizado, ...formasSingulares(normalizado), ...formasPlurais(normalizado)]) {
      const sinonimo = await IngredienteSinonimo.findOne({ where: { nome: candidato }, transaction });
      if (sinonimo) return Ingrediente.findByPk(sinonimo.ingredienteId, { transaction });
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

  /**
   * Registra `sinonimo` como outro nome de `principal`. Se já existir um
   * ingrediente cadastrado com o nome do sinônimo, ele é unificado no
   * principal: as receitas passam a usar o principal e o duplicado é apagado.
   */
  static async registrarSinonimo(sinonimo: string, principal: string, transaction?: Transaction): Promise<void> {
    const nomeSinonimo = normalizarNomeIngrediente(sinonimo);
    const alvo = await Ingrediente.obterOuCriar(principal, transaction);
    if (nomeSinonimo.localeCompare(alvo.nome, 'pt-BR', { sensitivity: 'base' }) === 0) return;

    const duplicado = await Ingrediente.findOne({ where: { nome: nomeSinonimo }, transaction });
    if (duplicado && duplicado.id !== alvo.id) {
      const ids = { antigo: duplicado.id, novo: alvo.id };
      // Receita que já tem os dois: fica só o principal
      await sequelize.query(
        `DELETE ir FROM item_receita ir
           JOIN item_receita outro ON outro.receita_id = ir.receita_id AND outro.ingrediente_id = :novo
          WHERE ir.ingrediente_id = :antigo`,
        { replacements: ids, transaction },
      );
      await sequelize.query('UPDATE item_receita SET ingrediente_id = :novo WHERE ingrediente_id = :antigo', {
        replacements: ids,
        transaction,
      });
      await sequelize.query('UPDATE ingrediente_sinonimo SET ingrediente_id = :novo WHERE ingrediente_id = :antigo', {
        replacements: ids,
        transaction,
      });
      await duplicado.destroy({ transaction });
    }

    const existente = await IngredienteSinonimo.findOne({ where: { nome: nomeSinonimo }, transaction });
    if (existente) await existente.update({ ingredienteId: alvo.id }, { transaction });
    else await IngredienteSinonimo.create({ nome: nomeSinonimo, ingredienteId: alvo.id }, { transaction });
  }

  /** Ingredientes usados em ao menos uma receita de autor ativo, com seus sinônimos. */
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

    const sinonimos = await IngredienteSinonimo.findAll({
      where: { ingredienteId: linhas.map((l) => l.id) },
      order: [['nome', 'ASC']],
    });
    return linhas.map((l) => ({
      id: l.id,
      nome: l.nome,
      sinonimos: sinonimos.filter((s) => s.ingredienteId === l.id).map((s) => s.nome),
    }));
  }

  /** Autocompletar: procura pelo nome principal e pelos sinônimos. */
  static pesquisar(termo: string | undefined, limite = 20) {
    if (!termo) return Ingrediente.findAll({ order: [['nome', 'ASC']], limit: limite });

    const normalizado = normalizarNomeIngrediente(termo);
    const escapado = normalizado.replace(/[\\%_]/g, (c) => `\\${c}`);
    const padrao = sequelize.escape(`%${escapado}%`);
    const relevancia = sequelize.literal(
      `CASE WHEN nome = ${sequelize.escape(normalizado)} THEN 0
            WHEN nome LIKE ${sequelize.escape(`${escapado}%`)} THEN 1
            ELSE 2 END`,
    );
    return Ingrediente.findAll({
      where: {
        [Op.or]: [
          { nome: { [Op.like]: `%${escapado}%` } },
          { id: { [Op.in]: sequelize.literal(`(SELECT ingrediente_id FROM ingrediente_sinonimo WHERE nome LIKE ${padrao})`) } },
        ],
      },
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
