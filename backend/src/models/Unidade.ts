/**
 * Unidades de medida dos itens da receita (enum Unidade do diagrama de classes).
 * O valor é o texto gravado no banco e exibido na tela.
 */
export enum Unidade {
  XICARA = 'xícara',
  UNIDADE = 'unidade',
  KG = 'kg',
  G = 'g',
  L = 'litro',
  ML = 'ml',
  COPO = 'copo',
}

export const UNIDADES = Object.values(Unidade);
