import { useEffect, useState } from 'react';
import { ErroApi } from '../api/http';
import { receitaApi } from '../api/receitaApi';
import type { Pagina, Receita } from '../api/tipos';
import { Aviso } from './Aviso';
import { Carregando } from './Carregando';
import { GradeReceitas } from './CardReceita';
import { FiltroCategorias } from './FiltroCategorias';

/** Lista paginada das receitas cadastradas, com filtro por categoria. */
export function ListaReceitas({ mostrarTotal = false }: { mostrarTotal?: boolean }) {
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

  function irParaPagina(nova: number) {
    setPagina(nova);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <FiltroCategorias
        valor={categoria}
        onChange={(c) => {
          setCategoria(c);
          setPagina(1);
        }}
      />
      <Aviso>{erro}</Aviso>
      {!resultado && !erro && <Carregando />}
      {resultado && mostrarTotal && resultado.total > 0 && (
        <p className="contagem">
          {resultado.total} {resultado.total === 1 ? 'receita' : 'receitas'}
        </p>
      )}
      {resultado && resultado.dados.length === 0 && <p className="vazio">Nenhuma receita nesta categoria ainda.</p>}
      {resultado && <GradeReceitas receitas={resultado.dados} />}
      {totalPaginas > 1 && (
        <nav className="paginacao" aria-label="Paginação">
          <button className="botao botao-fantasma" disabled={pagina === 1} onClick={() => irParaPagina(pagina - 1)}>
            ← Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button className="botao botao-fantasma" disabled={pagina >= totalPaginas} onClick={() => irParaPagina(pagina + 1)}>
            Próxima →
          </button>
        </nav>
      )}
    </>
  );
}
