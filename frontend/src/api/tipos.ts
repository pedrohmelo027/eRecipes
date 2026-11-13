
export type TipoUsuario = 'USUARIO' | 'ADMIN';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  ativo: boolean;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Ingrediente {
  id: number;
  nome: string;
}

export interface ItemReceita {
  quantidade: number | null;
  unidade: string | null;
  ingrediente: Ingrediente;
}

export interface Receita {
  id: number;
  titulo: string;
  modoPreparo: string;
  tempoPreparo: number | null;
  rendimento: number | null;
  fotoUrl: string | null;
  usuarioId: number;
  categoriaId: number;
  dataCriacao: string;
  dataAtualizacao: string;
  categoria?: Categoria;
  autor?: { id: number; nome: string };
  itens?: ItemReceita[];
}

export interface Pagina<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
}

export interface ItemReceitaEntrada {
  ingredienteId?: number;
  nome?: string;
  quantidade?: number | null;
  unidade?: string | null;
}

export interface ReceitaEntrada {
  titulo: string;
  categoriaId: number | '';
  modoPreparo: string;
  tempoPreparo?: number | null;
  rendimento?: number | null;
  fotoUrl?: string | null;
  itens: ItemReceitaEntrada[];
}
