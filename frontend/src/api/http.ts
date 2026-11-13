const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const CHAVE_TOKEN = 'erecipes.token';

export class ErroApi extends Error {
  readonly status: number;
  readonly campos: Record<string, string>;

  constructor(status: number, message: string, campos: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.campos = campos;
  }
}

let token: string | null = lerToken();
let aoExpirarSessao: (() => void) | null = null;

function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function obterToken() {
  return token;
}

export function definirToken(novo: string | null) {
  token = novo;
  try {
    if (novo) localStorage.setItem(CHAVE_TOKEN, novo);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    return;
  }
}

export function quandoSessaoExpirar(callback: () => void) {
  aoExpirarSessao = callback;
}

type Query = Record<string, string | number | undefined | null>;

interface Opcoes {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

export async function http<T>(caminho: string, { method = 'GET', body, query }: Opcoes = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, String(valor));
  }
  const url = `${BASE_URL}${caminho}${params.size ? `?${params}` : ''}`;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }

  if (resposta.status === 204) return undefined as T;

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    if (resposta.status === 401 && token) aoExpirarSessao?.();
    throw new ErroApi(resposta.status, dados.erro ?? 'Erro inesperado', dados.campos);
  }
  return dados as T;
}
