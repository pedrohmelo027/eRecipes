import { Categoria, Ingrediente } from '../models';
import type { IngredienteDisponivel } from '../models/Ingrediente';

export class CatalogoService {
  static listarCategorias(): Promise<Categoria[]> {
    return Categoria.findAll({ order: [['nome', 'ASC']] });
  }

  static ingredientesDisponiveis(): Promise<IngredienteDisponivel[]> {
    return Ingrediente.disponiveis();
  }

  static pesquisarIngredientes(termo?: string): Promise<Ingrediente[]> {
    return Ingrediente.pesquisar(termo);
  }
}
