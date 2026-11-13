import { Op } from 'sequelize';
import { TipoUsuario, Usuario } from '../models';
import { AppError, conflito, naoEncontrado } from '../utils/AppError';
import type { DadosAtualizarUsuario } from '../validators/schemas';

export class UsuarioService {
  static listar(termo?: string): Promise<Usuario[]> {
    const where = termo
      ? { [Op.or]: [{ nome: { [Op.like]: `%${termo}%` } }, { email: { [Op.like]: `%${termo}%` } }] }
      : {};
    return Usuario.findAll({ where, order: [['nome', 'ASC']] });
  }

  private static async obter(id: number): Promise<Usuario> {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw naoEncontrado('Usuário não encontrado');
    return usuario;
  }

  private static contarAdminsAtivos(): Promise<number> {
    return Usuario.count({ where: { tipoUsuario: TipoUsuario.ADMIN, ativo: true } });
  }

  static async atualizar(adminId: number, id: number, dados: DadosAtualizarUsuario): Promise<Usuario> {
    const usuario = await UsuarioService.obter(id);

    if (dados.email && dados.email !== usuario.email) {
      const emUso = await Usuario.findOne({ where: { email: dados.email, id: { [Op.ne]: id } } });
      if (emUso) throw conflito('E-mail já cadastrado', { email: 'Este e-mail já está em uso' });
    }

    const perdeAdmin = usuario.ehAdmin && dados.tipoUsuario === TipoUsuario.USUARIO;
    if (perdeAdmin) {
      if (id === adminId) throw new AppError(400, 'Você não pode remover o seu próprio perfil de Admin');
      if (usuario.ativo && (await UsuarioService.contarAdminsAtivos()) <= 1) {
        throw new AppError(400, 'O sistema precisa de ao menos um Admin ativo');
      }
    }

    await usuario.update(dados);
    return usuario;
  }

  static async desativar(adminId: number, id: number): Promise<Usuario> {
    if (id === adminId) throw new AppError(400, 'Você não pode desativar a sua própria conta');
    const usuario = await UsuarioService.obter(id);
    if (!usuario.ativo) return usuario;

    if (usuario.ehAdmin && (await UsuarioService.contarAdminsAtivos()) <= 1) {
      throw new AppError(400, 'O sistema precisa de ao menos um Admin ativo');
    }
    await usuario.update({ ativo: false });
    return usuario;
  }

  static async reativar(id: number): Promise<Usuario> {
    const usuario = await UsuarioService.obter(id);
    if (!usuario.ativo) await usuario.update({ ativo: true });
    return usuario;
  }
}
