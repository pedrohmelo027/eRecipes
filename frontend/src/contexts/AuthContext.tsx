import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/authApi';
import { definirToken, obterToken, quandoSessaoExpirar } from '../api/http';
import type { Receita, Usuario } from '../api/tipos';

interface ValorAuth {
  usuario: Usuario | null;
  carregando: boolean;
  ehAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  sair: () => void;
  podeAlterar: (receita: Receita) => boolean;
}

const AuthContext = createContext<ValorAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(() => obterToken() !== null);

  const sair = useCallback(() => {
    definirToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    quandoSessaoExpirar(sair);
    if (!obterToken()) return;
    authApi
      .me()
      .then(setUsuario)
      .catch(sair)
      .finally(() => setCarregando(false));
  }, [sair]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { token, usuario } = await authApi.login(email, senha);
    definirToken(token);
    setUsuario(usuario);
    return usuario;
  }, []);

  const valor = useMemo<ValorAuth>(() => {
    const ehAdmin = usuario?.tipoUsuario === 'ADMIN';
    return {
      usuario,
      carregando,
      ehAdmin,
      entrar,
      sair,
      podeAlterar: (receita) => !!usuario && (ehAdmin || receita.usuarioId === usuario.id),
    };
  }, [usuario, carregando, entrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
