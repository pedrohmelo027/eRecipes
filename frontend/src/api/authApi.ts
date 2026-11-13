import { http } from './http';
import type { Usuario } from './tipos';

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  confirmacaoSenha: string;
}

export const authApi = {
  cadastrar: (dados: DadosCadastro) => http<Usuario>('/auth/cadastro', { method: 'POST', body: dados }),
  login: (email: string, senha: string) =>
    http<{ token: string; usuario: Usuario }>('/auth/login', { method: 'POST', body: { email, senha } }),
  me: () => http<Usuario>('/auth/me'),
};
