import { createContext } from 'react';
import type { Receita, Usuario } from '../api/tipos';

export interface ValorAuth {
  usuario: Usuario | null;
  carregando: boolean;
  ehAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  sair: () => void;
  podeAlterar: (receita: Receita) => boolean;
}

export const AuthContext = createContext<ValorAuth | null>(null);
