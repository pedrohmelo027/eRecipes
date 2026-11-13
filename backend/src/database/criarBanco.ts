import mysql from 'mysql2/promise';
import { env } from '../config/env';

async function main() {
  const conexao = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });
  await conexao.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`Banco "${env.db.name}" pronto`);
  await conexao.end();
}

main().catch((erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
