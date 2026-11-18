const FRACOES_UNICODE: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅛': '1/8',
};

/**
 * Converte o texto de quantidade digitado na receita em número.
 * Aceita "2", "1,5", "0.5", "1/2", "1 1/2", "1 e 1/2", "½", "1½",
 * "meia", "meio" e "1 e meia". Retorna NaN se não entender.
 */
export function converterQuantidade(texto: string): number {
  let s = texto.trim().toLowerCase();
  for (const [simbolo, fracao] of Object.entries(FRACOES_UNICODE)) s = s.replaceAll(simbolo, ` ${fracao}`);
  s = s
    .replace(/\b(meia|meio)\b/g, '1/2')
    .replace(/\s+e\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  const decimal = /^\d+(?:[.,]\d+)?$/;
  const fracao = /^(\d+)\/(\d+)$/;
  const misto = /^(\d+) (\d+)\/(\d+)$/;

  if (decimal.test(s)) return Number(s.replace(',', '.'));
  let m = fracao.exec(s);
  if (m) return Number(m[2]) === 0 ? NaN : Number(m[1]) / Number(m[2]);
  m = misto.exec(s);
  if (m) return Number(m[3]) === 0 ? NaN : Number(m[1]) + Number(m[2]) / Number(m[3]);
  return NaN;
}
