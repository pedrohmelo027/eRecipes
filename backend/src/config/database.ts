import { Options, Sequelize } from 'sequelize';
import { env } from './env';

const opcoes: Options = {
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
};

// Com DATABASE_URL (Supabase) a conexão usa SSL; sem ela, usa o Postgres local definido em DB_*.
export const sequelize = env.db.url
  ? new Sequelize(env.db.url, {
      ...opcoes,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...opcoes,
      host: env.db.host,
      port: env.db.port,
    });
