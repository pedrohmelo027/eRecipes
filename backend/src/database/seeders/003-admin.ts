import bcrypt from 'bcryptjs';
import type { MigrationFn } from 'umzug';
import type { Sequelize } from 'sequelize';
import { env } from '../../config/env';
import { TipoUsuario, Usuario } from '../../models';

export const up: MigrationFn<Sequelize> = async () => {
  const { nome, email, senha } = env.admin;
  if (!email || !senha) {
    throw new Error('Defina ADMIN_EMAIL e ADMIN_SENHA no .env para criar o Admin inicial');
  }
  await Usuario.findOrCreate({
    where: { email: email.toLowerCase() },
    defaults: {
      nome,
      email: email.toLowerCase(),
      senhaHash: await bcrypt.hash(senha, 10),
      tipoUsuario: TipoUsuario.ADMIN,
    },
  });
};

export const down: MigrationFn<Sequelize> = async () => {
  if (env.admin.email) await Usuario.destroy({ where: { email: env.admin.email.toLowerCase() } });
};
