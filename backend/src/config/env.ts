import 'dotenv/config';

function obrigatoria(nome: string, padrao?: string): string {
  const valor = process.env[nome] ?? padrao;
  if (valor === undefined || valor === '') {
    throw new Error(`Variável de ambiente ${nome} não definida (veja .env.example)`);
  }
  return valor;
}

const ehTeste = process.env.NODE_ENV === 'test';

export const env = {
  ehTeste,
  port: Number(process.env.PORT ?? 3333),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  db: {
    host: obrigatoria('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: obrigatoria('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    name: ehTeste
      ? obrigatoria('DB_NAME_TEST', `${process.env.DB_NAME ?? 'erecipes'}_test`)
      : obrigatoria('DB_NAME', 'erecipes'),
  },

  jwt: {
    secret: obrigatoria('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },

  admin: {
    nome: process.env.ADMIN_NOME ?? 'Administrador',
    email: process.env.ADMIN_EMAIL,
    senha: process.env.ADMIN_SENHA,
  },
};
