import { useEffect, useState } from 'react';
import { ErroApi } from '../api/http';
import { receitaApi } from '../api/receitaApi';
import type { Ingrediente, ResultadoBusca } from '../api/tipos';
import { Aviso } from '../components/Aviso';
import { Carregando } from '../components/Carregando';
import { CardReceita } from '../components/CardReceita';
import { FiltroCategorias } from '../components/FiltroCategorias';
import { SeletorIngredientes } from '../components/SeletorIngredientes';

const CHAVE = 'erecipes.ultimaBusca';

interface EstadoBusca {
  ingredientes: Ingrediente[];
  categoria?: number;
  resultado: ResultadoBusca[] | null;
}

function lerUltimaBusca(): EstadoBusca {
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    if (salvo) {
      const busca: EstadoBusca = JSON.parse(salvo);
      // Buscas salvas antes da lista de ingredientes faltando são descartadas
      if (busca.resultado?.every((r) => Array.isArray(r.ingredientesFaltando))) return busca;
      return { ...busca, resultado: null };
    }
  } catch {
    // sessionStorage indisponível: começa uma busca nova
  }
  return { ingredientes: [], resultado: null };
}


export function BuscarReceitas() {
  const [estado, setEstado] = useState<EstadoBusca>(lerUltimaBusca);
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);

  function atualizar(parcial: Partial<EstadoBusca> | ((atual: EstadoBusca) => Partial<EstadoBusca>)) {
    setEstado((atual) => {
      const novo = { ...atual, ...(typeof parcial === 'function' ? parcial(atual) : parcial) };
      try {
        sessionStorage.setItem(CHAVE, JSON.stringify(novo));
      } catch {
        // sem sessionStorage a busca só não fica salva
      }
      return novo;
    });
  }

  const chaveBusca = estado.ingredientes.map((i) => i.id).join(',');

  // Busca automaticamente sempre que a seleção de ingredientes ou a categoria muda
  useEffect(() => {
    if (!chaveBusca) {
      setErro('');
      setBuscando(false);
      atualizar({ resultado: null });
      return;
    }
    let cancelado = false;
    setErro('');
    setBuscando(true);
    receitaApi
      .buscar(chaveBusca.split(',').map(Number), estado.categoria)
      .then((resultado) => !cancelado && atualizar({ resultado }))
      .catch((e) => !cancelado && setErro(e instanceof ErroApi ? e.message : 'Erro ao buscar receitas'))
      .finally(() => !cancelado && setBuscando(false));
    return () => {
      cancelado = true;
    };
  }, [chaveBusca, estado.categoria]);

  return (
    <>
      <section className="cabecalho-pagina">
        <h1>Buscar receitas</h1>
        <p className="subtitulo">
          Toque nos ingredientes que você tem em casa. Primeiro mostramos as receitas que dá para fazer <strong>só com esses ingredientes</strong>;
          depois, as que usam algum deles e o que falta comprar.
        </p>
      </section>

      <SeletorIngredientes selecionados={estado.ingredientes} onChange={(alterar) => atualizar((atual) => ({ ingredientes: alterar(atual.ingredientes) }))} />

      <h2 className="titulo-secao">Categoria</h2>
      <FiltroCategorias valor={estado.categoria} onChange={(categoria) => atualizar({ categoria })} />
      <Aviso>{erro}</Aviso>

      {buscando && !estado.resultado && <Carregando texto="Procurando receitas…" />}
      {estado.resultado && <Resultados resultado={estado.resultado} />}
    </>
  );
}

function Resultados({ resultado }: { resultado: ResultadoBusca[] }) {
  if (resultado.length === 0) {
    return (
      <div className="vazio">
        <p>
          <strong>Nenhuma receita encontrada.</strong>
        </p>
        <p>Nenhuma receita usa esses ingredientes. Tente outros ou remova o filtro de categoria.</p>
      </div>
    );
  }

  const completas = resultado.filter((r) => r.ingredientesFaltando.length === 0);
  const parciais = resultado.filter((r) => r.ingredientesFaltando.length > 0);
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

  return (
    <>
      <section className="grupo-resultado">
        <h2>Dá para fazer com o que você tem</h2>
        {completas.length ? (
          <>
            <p className="contagem">{plural(completas.length, 'receita encontrada', 'receitas encontradas')}</p>
            <div className="grade-receitas">
              {completas.map((r) => (
                <CardReceita key={r.id} receita={r} />
              ))}
            </div>
          </>
        ) : (
          <p className="contagem">Nenhuma receita usa só esses ingredientes. Veja abaixo o que falta para as outras.</p>
        )}
      </section>

      {parciais.length > 0 && (
        <section className="grupo-resultado">
          <h2>Faltam poucos ingredientes</h2>
          <p className="contagem">{plural(parciais.length, 'receita usa', 'receitas usam')} algum dos seus ingredientes</p>
          <div className="grade-receitas">
            {parciais.map((r) => (
              <CardReceita key={r.id} receita={r} faltando={r.ingredientesFaltando} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
