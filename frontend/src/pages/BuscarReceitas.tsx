import { useState, type FormEvent } from 'react';
import { ErroApi } from '../api/http';
import { receitaApi } from '../api/receitaApi';
import type { Ingrediente, Receita } from '../api/tipos';
import { Aviso } from '../components/Aviso';
import { CampoIngredientes } from '../components/CampoIngredientes';
import { Carregando } from '../components/Carregando';
import { GradeReceitas } from '../components/CardReceita';
import { FiltroCategorias } from '../components/FiltroCategorias';

const CHAVE = 'erecipes.ultimaBusca';

interface EstadoBusca {
  ingredientes: Ingrediente[];
  categoria?: number;
  resultado: Receita[] | null;
}

function lerUltimaBusca(): EstadoBusca {
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    if (salvo) return JSON.parse(salvo);
  } catch {

  }
  return { ingredientes: [], resultado: null };
}


export function BuscarReceitas() {
  const [estado, setEstado] = useState<EstadoBusca>(lerUltimaBusca);
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);

  function atualizar(parcial: Partial<EstadoBusca>) {
    setEstado((atual) => {
      const novo = { ...atual, ...parcial };
      try {
        sessionStorage.setItem(CHAVE, JSON.stringify(novo));
      } catch {
        
      }
      return novo;
    });
  }

  async function buscar(categoria = estado.categoria) {
    setErro('');
    if (!estado.ingredientes.length) {
      setErro('Informe ao menos um ingrediente para buscar.');
      return;
    }
    setBuscando(true);
    try {
      const resultado = await receitaApi.buscar(estado.ingredientes.map((i) => i.id), categoria);
      atualizar({ resultado, categoria });
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro ao buscar receitas');
    } finally {
      setBuscando(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    buscar();
  }

  function trocarCategoria(categoria: number | undefined) {
    atualizar({ categoria });
    if (estado.resultado) buscar(categoria);
  }

  return (
    <>
      <section className="cabecalho-pagina">
        <h1>Buscar receitas</h1>
        <p className="subtitulo">
          Informe o que você tem. Mostramos só as receitas que dá para fazer <strong>exclusivamente</strong> com esses ingredientes.
        </p>
      </section>

      <form className="painel-busca" onSubmit={handleSubmit}>
        <CampoIngredientes selecionados={estado.ingredientes} onChange={(ingredientes) => atualizar({ ingredientes })} />
        <button className="botao botao-primario" disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      <FiltroCategorias valor={estado.categoria} onChange={trocarCategoria} />
      <Aviso>{erro}</Aviso>

      {buscando && <Carregando texto="Procurando receitas…" />}
      {!buscando && estado.resultado && (
        <>
          {estado.resultado.length === 0 ? (
            <div className="vazio">
              <p>
                <strong>Nenhuma receita encontrada.</strong>
              </p>
              <p>Tente adicionar mais ingredientes que você tem em casa ou remover o filtro de categoria.</p>
            </div>
          ) : (
            <>
              <p className="contagem">
                {estado.resultado.length} {estado.resultado.length === 1 ? 'receita encontrada' : 'receitas encontradas'}
              </p>
              <GradeReceitas receitas={estado.resultado} />
            </>
          )}
        </>
      )}
    </>
  );
}
