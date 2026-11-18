export function normalizarNomeIngrediente(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function chaveIngrediente(nome: string): string {
  return normalizarNomeIngrediente(nome).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Possíveis formas no singular de um nome no plural ("ovos" → "ovo",
 * "limões" → "limão", "tomates cereja" → "tomate cereja").
 * Só a primeira palavra é alterada, que é onde o plural costuma estar.
 */
export function formasSingulares(nome: string): string[] {
  const [primeira, ...resto] = normalizarNomeIngrediente(nome).split(' ');
  const candidatas: string[] = [];
  for (const [fim, troca] of [
    ['ões', 'ão'],
    ['ães', 'ão'],
    ['ãos', 'ão'],
    ['es', ''],
    ['s', ''],
  ] as const) {
    if (primeira.length > fim.length + 1 && primeira.endsWith(fim)) {
      candidatas.push(primeira.slice(0, -fim.length) + troca);
    }
  }
  return [...new Set(candidatas)].map((p) => [p, ...resto].join(' '));
}

/** Possíveis formas no plural, para achar um ingrediente que foi cadastrado no plural. */
export function formasPlurais(nome: string): string[] {
  const [primeira, ...resto] = normalizarNomeIngrediente(nome).split(' ');
  const candidatas = primeira.endsWith('ão')
    ? [`${primeira.slice(0, -2)}ões`, `${primeira.slice(0, -2)}ães`, `${primeira}s`]
    : /[rz]$/.test(primeira)
      ? [`${primeira}es`]
      : [`${primeira}s`];
  return candidatas.map((p) => [p, ...resto].join(' '));
}
