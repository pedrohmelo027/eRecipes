import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErroApi } from '../api/http';
import { receitaApi } from '../api/receitaApi';
import type { ItemReceita, Receita } from '../api/tipos';
import { Aviso } from '../components/Aviso';
import { Carregando } from '../components/Carregando';
import { FotoReceita } from '../components/CardReceita';
import { useAuth } from '../contexts/AuthContext';

function formatarItem({ quantidade, unidade }: ItemReceita) {
  const qtd = quantidade !== null ? quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '';
  return [qtd, unidade].filter(Boolean).join(' ');
}


export function DetalheReceita() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { podeAlterar } = useAuth();
  const [receita, setReceita] = useState<Receita | null>(null);
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    setReceita(null);
    setErro('');
    receitaApi
      .obter(Number(id))
      .then(setReceita)
      .catch((e) => setErro(e instanceof ErroApi && e.status === 404 ? 'Receita não encontrada.' : 'Erro ao carregar a receita.'));
  }, [id]);

  async function excluir() {
    if (!receita) return;
  
    if (!window.confirm(`Excluir a receita "${receita.titulo}"? Esta ação não pode ser desfeita.`)) return;
    setExcluindo(true);
    try {
      await receitaApi.excluir(receita.id);
      navigate('/minhas-receitas', { replace: true });
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro ao excluir');
      setExcluindo(false);
    }
  }

  if (erro && !receita) {
    return (
      <div className="vazio">
        <Aviso>{erro}</Aviso>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }
  if (!receita) return <Carregando />;

  return (
    <article className="detalhe">
      <button type="button" className="link-voltar" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div className="detalhe-topo">
        <FotoReceita receita={receita} className="detalhe-foto" />
        <div className="detalhe-info">
          {receita.categoria && <span className="etiqueta">{receita.categoria.nome}</span>}
          <h1>{receita.titulo}</h1>
          {receita.autor && <p className="autor">por {receita.autor.nome}</p>}
          <dl className="fatos">
            <div>
              <dt>Preparo</dt>
              <dd>{receita.tempoPreparo ? `${receita.tempoPreparo} min` : '—'}</dd>
            </div>
            <div>
              <dt>Rendimento</dt>
              <dd>{receita.rendimento ? `${receita.rendimento} ${receita.rendimento === 1 ? 'porção' : 'porções'}` : '—'}</dd>
            </div>
            <div>
              <dt>Ingredientes</dt>
              <dd>{receita.itens?.length ?? 0}</dd>
            </div>
          </dl>
          {podeAlterar(receita) && (
            <div className="acoes">
              <Link to={`/receitas/${receita.id}/editar`} className="botao botao-secundario">
                Editar
              </Link>
              <button type="button" className="botao botao-perigo" onClick={excluir} disabled={excluindo}>
                {excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          )}
          <Aviso>{erro}</Aviso>
        </div>
      </div>

      <div className="detalhe-corpo">
        <section>
          <h2>Ingredientes</h2>
          <ul className="lista-ingredientes">
            {receita.itens?.map((item) => (
              <li key={item.ingrediente.id}>
                <span>{item.ingrediente.nome}</span>
                <span className="quantidade">{formatarItem(item)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Modo de preparo</h2>
          <div className="modo-preparo">{receita.modoPreparo}</div>
        </section>
      </div>
    </article>
  );
}
