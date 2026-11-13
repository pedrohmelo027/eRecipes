import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { catalogoApi } from '../api/catalogoApi';
import type { Ingrediente } from '../api/tipos';

interface Props {
  selecionados: Ingrediente[];
  onChange: (ingredientes: Ingrediente[]) => void;
}

export function CampoIngredientes({ selecionados, onChange }: Props) {
  const [termo, setTermo] = useState('');
  const [sugestoes, setSugestoes] = useState<Ingrediente[]>([]);
  const [destaque, setDestaque] = useState(0);
  const [aberto, setAberto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaId = useId();

  useEffect(() => {
    if (!termo.trim()) {
      setSugestoes([]);
      return;
    }
    const temporizador = setTimeout(() => {
      catalogoApi
        .ingredientes(termo)
        .then((lista) => {
          const ids = new Set(selecionados.map((s) => s.id));
          setSugestoes(lista.filter((i) => !ids.has(i.id)));
          setDestaque(0);
        })
        .catch(() => setSugestoes([]));
    }, 200);
    return () => clearTimeout(temporizador);
  }, [termo, selecionados]);

  function adicionar(ingrediente: Ingrediente) {
    onChange([...selecionados, ingrediente]);
    setTermo('');
    setSugestoes([]);
    inputRef.current?.focus();
  }

  function remover(id: number) {
    onChange(selecionados.filter((i) => i.id !== id));
  }

  function handleTecla(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestaque((d) => Math.min(d + 1, sugestoes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (sugestoes[destaque]) adicionar(sugestoes[destaque]);
    } else if (e.key === 'Backspace' && !termo && selecionados.length) {
      remover(selecionados[selecionados.length - 1].id);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  }

  const mostrarLista = aberto && termo.trim() !== '';

  return (
    <div className="campo-ingredientes">
      <div className="chips-entrada" onClick={() => inputRef.current?.focus()}>
        {selecionados.map((i) => (
          <span key={i.id} className="chip chip-ativo">
            {i.nome}
            <button type="button" aria-label={`Remover ${i.nome}`} onClick={() => remover(i.id)}>
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setAberto(true);
          }}
          onKeyDown={handleTecla}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder={selecionados.length ? 'Adicionar mais…' : 'Ex.: ovo, leite, farinha…'}
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls={listaId}
          aria-label="Ingrediente"
        />
      </div>
      {mostrarLista && (
        <ul id={listaId} className="sugestoes" role="listbox">
          {sugestoes.length ? (
            sugestoes.map((s, indice) => (
              <li
                key={s.id}
                role="option"
                aria-selected={indice === destaque}
                className={indice === destaque ? 'sugestao-ativa' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  adicionar(s);
                }}
              >
                {s.nome}
              </li>
            ))
          ) : (
            <li className="sugestao-vazia">Nenhum ingrediente encontrado</li>
          )}
        </ul>
      )}
    </div>
  );
}
