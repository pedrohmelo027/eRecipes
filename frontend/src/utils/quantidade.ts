const FRACOES: [number, string][] = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [1 / 2, '1/2'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
];

export function formatarQuantidade(valor: number): string {
  const inteiro = Math.floor(valor);
  const resto = valor - inteiro;
  if (resto < 0.01) return String(inteiro);
  const fracao = FRACOES.find(([numero]) => Math.abs(numero - resto) < 0.011);
  if (fracao) return inteiro ? `${inteiro} ${fracao[1]}` : fracao[1];
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
