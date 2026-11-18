
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

/** Mesma lista do backend (backend/src/models/UnidadeMedida.ts). */
export const UNIDADES_MEDIDA = [
  'unidade',
  'g',
  'kg',
  'mg',
  'ml',
  'litro',
  'xícara',
  'copo',
  'colher de sopa',
  'colher de chá',
  'colher de café',
  'pitada',
  'gota',
  'dente',
  'fatia',
  'pedaço',
  'folha',
  'ramo',
  'maço',
  'pé',
  'lata',
  'pacote',
  'caixa',
  'vidro',
  'sachê',
  'a gosto',
] as const;

export type UnidadeMedida = (typeof UNIDADES_MEDIDA)[number];

export interface Ingrediente {
  id: number;
  nome: string;
}

export interface IngredienteDisponivel extends Ingrediente {
  /** Outros nomes do mesmo ingrediente (ex.: aipim e macaxeira para mandioca). */
  sinonimos: string[];
}

export interface ItemReceita {
  quantidade: number | null;
  unidade: UnidadeMedida | null;
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

export interface ResultadoBusca extends Receita {
  /** Ingredientes da receita que não estão na lista informada. */
  ingredientesFaltando: string[];
}

export interface ItemReceitaEntrada {
  ingredienteId?: number;
  nome?: string;
  quantidade?: number | null;
  unidade?: UnidadeMedida | null;
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
