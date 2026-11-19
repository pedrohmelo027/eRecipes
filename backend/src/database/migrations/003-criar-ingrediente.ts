import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';

// Collation que ignora maiúsculas e acentos ("Açúcar" = "acucar"), como a utf8mb4_unicode_ci do MySQL.
export const COLLATION = 'ci_ai';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.sequelize.query(
    `CREATE COLLATION IF NOT EXISTS ${COLLATION} (provider = icu, locale = 'und-u-ks-level1', deterministic = false)`,
  );
  // unaccent: usada na busca por trecho do nome (LIKE não funciona com collation não determinística).
  // No Supabase as extensões ficam no schema "extensions" (que já está no search_path).
  await qi.sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
        CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;
      ELSE
        CREATE EXTENSION IF NOT EXISTS unaccent;
      END IF;
    END $$;`);
  await qi.createTable('ingrediente', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: `VARCHAR(100) COLLATE ${COLLATION}`, allowNull: false, unique: true },
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable('ingrediente', {});
  await qi.sequelize.query(`DROP COLLATION IF EXISTS ${COLLATION}`);
};
