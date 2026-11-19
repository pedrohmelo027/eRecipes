import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';

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
    // Connection string do Supabase. Ignorada nos testes, para nunca apagar o banco de produção.
    url: ehTeste ? undefined : process.env.DATABASE_URL || undefined,
    host: obrigatoria('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    name: ehTeste
      ? obrigatoria('DB_NAME_TEST', `${process.env.DB_NAME ?? 'erecipes'}_test`)
      : obrigatoria('DB_NAME', 'erecipes'),
  },

  jwt: {
    secret: obrigatoria('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },

  uploadDir: path.resolve(
    process.env.UPLOAD_DIR ?? (ehTeste ? path.join(os.tmpdir(), 'erecipes-uploads-test') : 'uploads'),
  ),

  // Supabase Storage para as fotos. Sem estas variáveis (ou nos testes), as fotos ficam em uploadDir.
  supabase: {
    url: ehTeste ? undefined : process.env.SUPABASE_URL || undefined,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    bucket: process.env.SUPABASE_BUCKET ?? 'fotos-receitas',
  },

  admin: {
    nome: process.env.ADMIN_NOME ?? 'Administrador',
    email: process.env.ADMIN_EMAIL,
    senha: process.env.ADMIN_SENHA,
  },
};
