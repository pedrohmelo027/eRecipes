import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { TipoUsuario, Usuario } from '../models';
import { AppError, conflito, naoEncontrado } from '../utils/AppError';
import type { DadosCadastro } from '../validators/schemas';

const CUSTO_BCRYPT = 10;

export class AuthService {
  static async cadastrar(dados: DadosCadastro): Promise<Usuario> {
    if (await Usuario.findOne({ where: { email: dados.email } })) {
      throw conflito('E-mail já cadastrado', { email: 'Este e-mail já está em uso' });
    }
    const senhaHash = await bcrypt.hash(dados.senha, CUSTO_BCRYPT);
    const usuario = await Usuario.create({
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      tipoUsuario: TipoUsuario.USUARIO,
    });
    return (await Usuario.findByPk(usuario.id))!;
  }

  static async autenticar(email: string, senha: string): Promise<{ token: string; usuario: Usuario }> {
    const usuario = await Usuario.scope('comSenha').findOne({ where: { email } });
    const senhaConfere = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false;

    if (!usuario || !senhaConfere) throw new AppError(401, 'E-mail ou senha incorretos');
    if (!usuario.ativo) throw new AppError(403, 'Conta desativada. Procure um administrador');

    return { token: AuthService.gerarToken(usuario), usuario };
  }

  static gerarToken(usuario: Usuario): string {
    return jwt.sign({ tipoUsuario: usuario.tipoUsuario }, env.jwt.secret, {
      subject: String(usuario.id),
      expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
    });
  }

  static async perfil(id: number): Promise<Usuario> {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw naoEncontrado('Usuário não encontrado');
    return usuario;
  }
}
