import pg from 'pg';
import { Options, Sequelize } from 'sequelize';
import { env } from './env';

const opcoes: Options = {
  dialect: 'postgres',
  // Import explícito para o bundler da Vercel incluir o driver (o Sequelize o carrega dinamicamente).
  dialectModule: pg,
  logging: false,
  // Na Vercel cada instância da Function abre poucas conexões; o pooler do Supabase faz o resto.
  pool: process.env.VERCEL ? { max: 2, min: 0, idle: 5000, acquire: 10000 } : undefined,
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
