import { http } from './http';
import type { Pagina, Receita, ReceitaEntrada } from './tipos';

export const receitaApi = {
  listar: (pagina = 1, categoria?: number) =>
    http<Pagina<Receita>>('/receitas', { query: { pagina, categoria } }),
  buscar: (ingredientes: number[], categoria?: number) =>
    http<Receita[]>('/receitas/busca', { query: { ingredientes: ingredientes.join(','), categoria } }),
  minhas: () => http<Receita[]>('/receitas/minhas'),
  obter: (id: number) => http<Receita>(`/receitas/${id}`),
  criar: (dados: ReceitaEntrada) => http<Receita>('/receitas', { method: 'POST', body: dados }),
  atualizar: (id: number, dados: ReceitaEntrada) =>
    http<Receita>(`/receitas/${id}`, { method: 'PUT', body: dados }),
  excluir: (id: number) => http<void>(`/receitas/${id}`, { method: 'DELETE' }),
};
