import { Link } from 'react-router-dom';
import { ListaReceitas } from '../components/ListaReceitas';
import { useAuth } from '../hooks/useAuth';

export function Inicio() {
  const { usuario } = useAuth();

  return (
    <>
      <section className="hero">
        <h1>O que cozinhar hoje?</h1>
        <p>Diga quais ingredientes você tem em casa e descubra receitas que dá para fazer só com eles.</p>
        <Link to={usuario ? '/buscar' : '/login'} className="botao botao-primario botao-grande">
          Buscar pelos meus ingredientes
        </Link>
      </section>

      <section>
        <div className="cabecalho-secao">
          <h2>Receitas recentes</h2>
          <Link to="/receitas">Ver todas as receitas →</Link>
        </div>
        <ListaReceitas />
      </section>
    </>
  );
}
