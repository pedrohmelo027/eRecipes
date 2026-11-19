import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';
import { COLLATION } from './003-criar-ingrediente';

// Sinônimos passam a ser ingredientes de verdade, ligados por uma auto-associação (ingrediente.sinonimo_id)
// e marcados pelo enum Sinonimo (SINONIMO | PADRAO), como no diagrama de classes. Não há mais nome principal:
// quem escreve "aipim" na receita continua vendo "aipim".
const TIPOS = ['SINONIMO', 'PADRAO'];

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (transaction) => {
    await qi.addColumn(
      'ingrediente',
      'tipo',
      { type: DataTypes.ENUM(...TIPOS), allowNull: false, defaultValue: 'PADRAO' },
      { transaction },
    );
    await qi.addColumn(
      'ingrediente',
      'sinonimo_id',
      {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'ingrediente', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      { transaction },
    );
    await qi.addIndex('ingrediente', ['sinonimo_id'], { transaction });
    await qi.sequelize.query(
      `ALTER TABLE ingrediente
         ADD CONSTRAINT ingrediente_sinonimo_de_outro CHECK (sinonimo_id <> id),
         ADD CONSTRAINT ingrediente_sinonimo_tipo CHECK (sinonimo_id IS NULL OR tipo = 'SINONIMO')`,
      { transaction },
    );

    // Cada nome da antiga tabela vira um ingrediente ligado ao ingrediente a que pertencia.
    await qi.sequelize.query(
      `INSERT INTO ingrediente (nome, tipo, sinonimo_id)
       SELECT nome, 'SINONIMO', ingrediente_id FROM ingrediente_sinonimo
       ON CONFLICT (nome) DO UPDATE SET tipo = 'SINONIMO', sinonimo_id = EXCLUDED.sinonimo_id`,
      { transaction },
    );
    await qi.sequelize.query(
      `UPDATE ingrediente SET tipo = 'SINONIMO'
        WHERE id IN (SELECT ingrediente_id FROM ingrediente_sinonimo)`,
      { transaction },
    );
    await qi.dropTable('ingrediente_sinonimo', { transaction });
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (transaction) => {
    await qi.createTable(
      'ingrediente_sinonimo',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nome: { type: `VARCHAR(100) COLLATE ${COLLATION}`, allowNull: false, unique: true },
        ingrediente_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'ingrediente', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      },
      { transaction },
    );
    await qi.addIndex('ingrediente_sinonimo', ['ingrediente_id'], { transaction });

    // Volta ao modelo com nome principal: o ingrediente a que os outros apontam.
    await qi.sequelize.query(
      `INSERT INTO ingrediente_sinonimo (nome, ingrediente_id)
       SELECT nome, sinonimo_id FROM ingrediente WHERE sinonimo_id IS NOT NULL`,
      { transaction },
    );
    await qi.sequelize.query(
      `DELETE FROM item_receita ir USING (
         SELECT x.receita_id, x.ingrediente_id,
                ROW_NUMBER() OVER (PARTITION BY x.receita_id, COALESCE(i.sinonimo_id, i.id)
                                   ORDER BY i.sinonimo_id IS NOT NULL, i.id) AS n
           FROM item_receita x JOIN ingrediente i ON i.id = x.ingrediente_id) repetido
        WHERE repetido.n > 1 AND ir.receita_id = repetido.receita_id AND ir.ingrediente_id = repetido.ingrediente_id`,
      { transaction },
    );
    await qi.sequelize.query(
      `UPDATE item_receita ir SET ingrediente_id = s.sinonimo_id
         FROM ingrediente s WHERE s.id = ir.ingrediente_id AND s.sinonimo_id IS NOT NULL`,
      { transaction },
    );
    await qi.sequelize.query('DELETE FROM ingrediente WHERE sinonimo_id IS NOT NULL', { transaction });

    await qi.removeColumn('ingrediente', 'sinonimo_id', { transaction });
    await qi.removeColumn('ingrediente', 'tipo', { transaction });
    await qi.sequelize.query('DROP TYPE IF EXISTS enum_ingrediente_tipo', { transaction });
  });
};
