import { useEffect, useState } from 'react';
import { catalogoApi } from '../api/catalogoApi';
import type { Categoria } from '../api/tipos';

interface Props {
  valor: number | undefined;
  onChange: (categoria: number | undefined) => void;
}

export function FiltroCategorias({ valor, onChange }: Props) {
  const categorias = useCategorias();

  return (
    <div className="filtro-categorias" role="group" aria-label="Filtrar por categoria">
      <button type="button" className={`chip ${valor === undefined ? 'chip-ativo' : ''}`} onClick={() => onChange(undefined)}>
        Todas
      </button>
      {categorias.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`chip ${valor === c.id ? 'chip-ativo' : ''}`}
          aria-pressed={valor === c.id}
          onClick={() => onChange(valor === c.id ? undefined : c.id)}
        >
          {c.nome}
        </button>
      ))}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  useEffect(() => {
    catalogoApi.categorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);
  return categorias;
}
