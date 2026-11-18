import { http } from './http';
import type { Categoria, Ingrediente, IngredienteDisponivel } from './tipos';

export const catalogoApi = {
  categorias: () => http<Categoria[]>('/categorias'),
  ingredientesDisponiveis: () => http<IngredienteDisponivel[]>('/ingredientes/disponiveis'),
  ingredientes: (q: string) => http<Ingrediente[]>('/ingredientes', { query: { q } }),
};
