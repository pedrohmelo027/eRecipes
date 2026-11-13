import { Transaction } from 'sequelize';
import { Categoria, Ingrediente, ItemReceita, Receita, sequelize, TipoUsuario, Usuario } from '../models';
import type { UsuarioAutenticado } from '../middlewares/autenticacao';
import { AppError, naoEncontrado, proibido } from '../utils/AppError';
import type { DadosReceitaEntrada } from '../validators/schemas';

interface Paginacao {
  pagina: number;
  limite: number;
  categoria?: number;
}

export class ReceitaService {

  static podeAlterar(usuario: UsuarioAutenticado, receita: Receita): boolean {
    return usuario.tipoUsuario === TipoUsuario.ADMIN || receita.usuarioId === usuario.id;
  }


  static async listar({ pagina, limite, categoria }: Paginacao) {
    const { rows, count } = await Receita.findAndCountAll({
      where: categoria ? { categoriaId: categoria } : {},
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Usuario, as: 'autor', attributes: ['id', 'nome'], where: { ativo: true } },
      ],
      order: [['dataCriacao', 'DESC']],
      limit: limite,
      offset: (pagina - 1) * limite,
      distinct: true,
    });
    return { dados: rows, total: count, pagina, limite };
  }

  
  static buscar(ingredientes: number[], categoria?: number): Promise<Receita[]> {
    return Receita.buscarPorIngredientes(ingredientes, categoria);
  }

 
  static minhas(usuarioId: number): Promise<Receita[]> {
    return Receita.findAll({
      where: { usuarioId },
      include: Receita.includeCompleto,
      order: [['dataAtualizacao', 'DESC']],
    });
  }

  
  static async obter(id: number, transaction?: Transaction): Promise<Receita> {
    const receita = await Receita.findByPk(id, { include: Receita.includeCompleto, transaction });
    if (!receita) throw naoEncontrado('Receita não encontrada');
    return receita;
  }

  
  static async criar(usuario: UsuarioAutenticado, dados: DadosReceitaEntrada): Promise<Receita> {
    Receita.validar(dados);
    await ReceitaService.garantirCategoria(dados.categoriaId);

    const id = await sequelize.transaction(async (transaction) => {
      const receita = await Receita.create(
        { ...ReceitaService.camposReceita(dados), usuarioId: usuario.id },
        { transaction },
      );
      await ReceitaService.gravarItens(receita.id, dados.itens, transaction);
      return receita.id;
    });
    return ReceitaService.obter(id);
  }

 
  static async atualizar(usuario: UsuarioAutenticado, id: number, dados: DadosReceitaEntrada): Promise<Receita> {
    const receita = await Receita.findByPk(id);
    if (!receita) throw naoEncontrado('Receita não encontrada');
    if (!ReceitaService.podeAlterar(usuario, receita)) throw proibido('Você só pode editar as suas receitas');

    Receita.validar(dados);
    await ReceitaService.garantirCategoria(dados.categoriaId);

    await sequelize.transaction(async (transaction) => {
      await receita.update(ReceitaService.camposReceita(dados), { transaction });
      await ItemReceita.destroy({ where: { receitaId: id }, transaction });
      await ReceitaService.gravarItens(id, dados.itens, transaction);
    });
    return ReceitaService.obter(id);
  }


  static async excluir(usuario: UsuarioAutenticado, id: number): Promise<void> {
    const receita = await Receita.findByPk(id);
    if (!receita) throw naoEncontrado('Receita não encontrada');
    if (!ReceitaService.podeAlterar(usuario, receita)) throw proibido('Você só pode excluir as suas receitas');
    await receita.destroy();
  }

  private static camposReceita(dados: DadosReceitaEntrada) {
    return {
      titulo: dados.titulo,
      categoriaId: dados.categoriaId,
      modoPreparo: dados.modoPreparo,
      tempoPreparo: dados.tempoPreparo ?? null,
      rendimento: dados.rendimento ?? null,
      fotoUrl: dados.fotoUrl ?? null,
    };
  }

  private static async garantirCategoria(categoriaId: number) {
    
    if (!(await Categoria.findByPk(categoriaId))) {
      throw new AppError(400, 'Categoria inválida', { categoriaId: 'Escolha uma categoria da lista' });
    }
  }


  private static async gravarItens(
    receitaId: number,
    itens: DadosReceitaEntrada['itens'],
    transaction: Transaction,
  ) {
    const vistos = new Set<number>();
    for (const [indice, item] of itens.entries()) {
      let ingrediente: Ingrediente | null;
      if (item.ingredienteId) {
        ingrediente = await Ingrediente.findByPk(item.ingredienteId, { transaction });
        if (!ingrediente) {
          throw new AppError(400, 'Ingrediente inexistente', { [`itens.${indice}`]: 'Ingrediente não encontrado' });
        }
      } else {
        ingrediente = await Ingrediente.obterOuCriar(item.nome!, transaction);
      }

      if (vistos.has(ingrediente.id)) {
        throw new AppError(400, 'Ingrediente repetido na receita', {
          [`itens.${indice}`]: `"${ingrediente.nome}" já foi informado`,
        });
      }
      vistos.add(ingrediente.id);

      await ItemReceita.create(
        {
          receitaId,
          ingredienteId: ingrediente.id,
          quantidade: item.quantidade ?? null,
          unidade: item.unidade || null,
        },
        { transaction },
      );
    }
  }
}
