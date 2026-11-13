import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { usuario, ehAdmin, sair } = useAuth();
  const navigate = useNavigate();

  function handleSair() {
    sair();
    navigate('/');
  }

  return (
    <>
      <header className="topo">
        <div className="topo-conteudo">
          <Link to="/" className="marca">
            <span aria-hidden>🍳</span> eRecipes
          </Link>
          <nav className="menu">
            {usuario ? (
              <>
                <NavLink to="/buscar">Buscar</NavLink>
                <NavLink to="/minhas-receitas">Minhas receitas</NavLink>
                {ehAdmin && <NavLink to="/admin/usuarios">Usuários</NavLink>}
                <span className="menu-usuario" title={usuario.email}>
                  Olá, {usuario.nome.split(' ')[0]}
                </span>
                <button type="button" className="botao botao-fantasma" onClick={handleSair}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Entrar</NavLink>
                <Link to="/cadastro" className="botao botao-primario">
                  Cadastrar-se
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="conteudo">
        <Outlet />
      </main>
      <footer className="rodape">eRecipes · o que cozinhar com o que você já tem</footer>
    </>
  );
}
