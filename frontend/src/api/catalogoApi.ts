import { http } from './http';
import type { Categoria, Ingrediente } from './tipos';

export const catalogoApi = {
  categorias: () => http<Categoria[]>('/categorias'),
  ingredientes: (q: string) => http<Ingrediente[]>('/ingredientes', { query: { q } }),
};
