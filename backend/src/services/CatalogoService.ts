import { Categoria, Ingrediente } from '../models';

export class CatalogoService {
  static listarCategorias(): Promise<Categoria[]> {
    return Categoria.findAll({ order: [['nome', 'ASC']] });
  }

  static pesquisarIngredientes(termo?: string): Promise<Ingrediente[]> {
    return Ingrediente.pesquisar(termo);
  }
}
