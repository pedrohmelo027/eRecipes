import { Client } from 'pg';
import { env } from '../config/env';

// Só para o Postgres local: no Supabase o banco já existe.
export async function criarBanco(nome = env.db.name) {
  const cliente = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  });
  await cliente.connect();
  try {
    const { rowCount } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [nome]);
    if (!rowCount) await cliente.query(`CREATE DATABASE "${nome.replace(/"/g, '""')}"`);
  } finally {
    await cliente.end();
  }
}

if (require.main === module) {
  if (env.db.url) {
    console.log('DATABASE_URL definida (Supabase): o banco já existe, nada a criar');
  } else {
    criarBanco()
      .then(() => console.log(`Banco "${env.db.name}" pronto`))
      .catch((erro) => {
        console.error(erro.message);
        process.exitCode = 1;
      });
  }
}
