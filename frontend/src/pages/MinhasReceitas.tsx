import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErroApi } from '../api/http';
import { receitaApi } from '../api/receitaApi';
import type { Receita } from '../api/tipos';
import { Aviso } from '../components/Aviso';
import { Carregando } from '../components/Carregando';
import { GradeReceitas } from '../components/CardReceita';

export function MinhasReceitas() {
  const [receitas, setReceitas] = useState<Receita[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    receitaApi
      .minhas()
      .then(setReceitas)
      .catch((e) => setErro(e instanceof ErroApi ? e.message : 'Erro ao carregar suas receitas'));
  }, []);

  return (
    <>
      <section className="cabecalho-pagina cabecalho-com-acao">
        <div>
          <h1>Minhas receitas</h1>
          <p className="subtitulo">Receitas que você publicou.</p>
        </div>
        <Link to="/receitas/nova" className="botao botao-primario">
          + Nova receita
        </Link>
      </section>
      <Aviso>{erro}</Aviso>
      {!receitas && !erro && <Carregando />}
      {receitas?.length === 0 && (
        <div className="vazio">
          <p>Você ainda não publicou nenhuma receita.</p>
          <Link to="/receitas/nova">Publicar a primeira</Link>
        </div>
      )}
      {receitas && <GradeReceitas receitas={receitas} />}
    </>
  );
}
