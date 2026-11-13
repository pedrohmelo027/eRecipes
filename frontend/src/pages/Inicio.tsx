import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErroApi } from '../api/http';
import { receitaApi } from '../api/receitaApi';
import type { Pagina, Receita } from '../api/tipos';
import { Aviso } from '../components/Aviso';
import { Carregando } from '../components/Carregando';
import { GradeReceitas } from '../components/CardReceita';
import { FiltroCategorias } from '../components/FiltroCategorias';
import { useAuth } from '../contexts/AuthContext';

export function Inicio() {
  const { usuario } = useAuth();
  const [categoria, setCategoria] = useState<number>();
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<Pagina<Receita> | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setErro('');
    receitaApi
      .listar(pagina, categoria)
      .then(setResultado)
      .catch((e) => setErro(e instanceof ErroApi ? e.message : 'Erro ao carregar receitas'));
  }, [pagina, categoria]);

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / resultado.limite)) : 1;

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
        </div>
        <FiltroCategorias
          valor={categoria}
          onChange={(c) => {
            setCategoria(c);
            setPagina(1);
          }}
        />
        <Aviso>{erro}</Aviso>
        {!resultado && !erro && <Carregando />}
        {resultado && resultado.dados.length === 0 && <p className="vazio">Nenhuma receita nesta categoria ainda.</p>}
        {resultado && <GradeReceitas receitas={resultado.dados} />}
        {totalPaginas > 1 && (
          <nav className="paginacao" aria-label="Paginação">
            <button className="botao botao-fantasma" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
              ← Anterior
            </button>
            <span>
              Página {pagina} de {totalPaginas}
            </span>
            <button className="botao botao-fantasma" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
              Próxima →
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
