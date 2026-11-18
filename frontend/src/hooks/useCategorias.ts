import { useEffect, useState } from 'react';
import { catalogoApi } from '../api/catalogoApi';
import type { Categoria } from '../api/tipos';

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  useEffect(() => {
    catalogoApi.categorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);
  return categorias;
}
