import { useEffect, useState } from 'react';
import { catalogoApi } from '../api/catalogoApi';
import type { Ingrediente, IngredienteDisponivel } from '../api/tipos';

interface Props {
  selecionados: Ingrediente[];
  onChange: (alterar: (atuais: Ingrediente[]) => Ingrediente[]) => void;
}

export function SeletorIngredientes({ selecionados, onChange }: Props) {
  const [disponiveis, setDisponiveis] = useState<IngredienteDisponivel[] | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    catalogoApi
      .ingredientesDisponiveis()
      .then(setDisponiveis)
      .catch(() => setFalhou(true));
  }, []);

  const ids = new Set(selecionados.map((i) => i.id));

  function alternar({ id, nome }: Ingrediente) {
    onChange((atuais) => (atuais.some((i) => i.id === id) ? atuais.filter((i) => i.id !== id) : [...atuais, { id, nome }]));
  }

  if (falhou) return <p className="contagem">Não foi possível carregar os ingredientes.</p>;
  if (!disponiveis) return <p className="contagem">Carregando ingredientes…</p>;
  if (!disponiveis.length) return <p className="contagem">Ainda não há receitas cadastradas.</p>;

  return (
    <div className="seletor-ingredientes">
      <div className="seletor-cabecalho">
        <span>
          {selecionados.length
            ? `${selecionados.length} ${selecionados.length === 1 ? 'ingrediente selecionado' : 'ingredientes selecionados'}`
            : 'Toque nos ingredientes que você tem em casa'}
        </span>
        {selecionados.length > 0 && (
          <button type="button" className="botao-link" onClick={() => onChange(() => [])}>
            Limpar seleção
          </button>
        )}
      </div>
      <div className="filtro-categorias" role="group" aria-label="Ingredientes que você tem">
        {disponiveis.map((i) => (
          <button
            key={i.id}
            type="button"
            className={`chip ${ids.has(i.id) ? 'chip-ativo' : ''}`}
            aria-pressed={ids.has(i.id)}
            aria-label={i.sinonimos.length ? `${i.nome} (também chamado de ${i.sinonimos.join(', ')})` : undefined}
            title={i.sinonimos.length ? `Também chamado de ${i.sinonimos.join(', ')}` : undefined}
            onClick={() => alternar(i)}
          >
            {ids.has(i.id) ? '✓ ' : ''}
            {i.nome}
            {i.sinonimos.length > 0 && <span className="chip-sinonimos"> / {i.sinonimos.join(' / ')}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
