import { Link } from 'react-router-dom';
import { ListaReceitas } from '../components/ListaReceitas';
import { useAuth } from '../hooks/useAuth';

export function TodasReceitas() {
  const { usuario } = useAuth();

  return (
    <>
      <section className="cabecalho-pagina">
        <h1>Todas as receitas</h1>
        <p className="subtitulo">
          Navegue por todas as receitas cadastradas ou filtre por categoria.{' '}
          {usuario ? (
            <>
              Quer saber o que dá para fazer com o que tem em casa? <Link to="/buscar">Busque pelos seus ingredientes</Link>.
            </>
          ) : (
            <>
              <Link to="/login">Entre</Link> para buscar pelos ingredientes que você tem em casa.
            </>
          )}
        </p>
      </section>
      <ListaReceitas mostrarTotal />
    </>
  );
}
