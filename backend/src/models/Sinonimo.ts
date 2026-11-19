// Indica se o ingrediente faz parte de um grupo de sinônimos (aipim, mandioca, macaxeira...) ou não.
// Não existe nome principal: todos os ingredientes do grupo valem o mesmo e cada receita mantém o nome usado.
export enum Sinonimo {
  SINONIMO = 'SINONIMO',
  PADRAO = 'PADRAO',
}

export const SINONIMOS_TIPOS = Object.values(Sinonimo);
