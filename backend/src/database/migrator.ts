import path from 'path';
import { SequelizeStorage, Umzug, type MigrationParams, type RunnableMigration } from 'umzug';
import { sequelize } from '../models';

const padrao = '*.{ts,js}';
const ignorar = ['**/*.d.ts'];

function resolver<T>({ name, path: arquivo, context }: MigrationParams<T>): RunnableMigration<T> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const modulo = require(arquivo!);
  return {
    name: name.replace(/\.(ts|js)$/, ''),
    path: arquivo,
    up: () => modulo.up({ name, path: arquivo, context }),
    down: () => modulo.down({ name, path: arquivo, context }),
  };
}

export const migrator = new Umzug({
  migrations: {
    glob: [padrao, { cwd: path.join(__dirname, 'migrations'), ignore: ignorar }],
    resolve: resolver,
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeMeta', tableName: 'sequelize_meta' }),
  logger: undefined,
});

export const seeder = new Umzug({
  migrations: {
    glob: [padrao, { cwd: path.join(__dirname, 'seeders'), ignore: ignorar }],
    resolve: resolver,
  },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeData', tableName: 'sequelize_data' }),
  logger: undefined,
});
