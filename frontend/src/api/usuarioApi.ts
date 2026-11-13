import { http } from './http';
import type { TipoUsuario, Usuario } from './tipos';

export interface DadosEdicaoUsuario {
  nome?: string;
  email?: string;
  tipoUsuario?: TipoUsuario;
}

export const usuarioApi = {
  listar: (q?: string) => http<Usuario[]>('/usuarios', { query: { q } }),
  atualizar: (id: number, dados: DadosEdicaoUsuario) =>
    http<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: dados }),
  desativar: (id: number) => http<Usuario>(`/usuarios/${id}/desativar`, { method: 'PATCH' }),
  reativar: (id: number) => http<Usuario>(`/usuarios/${id}/reativar`, { method: 'PATCH' }),
};
