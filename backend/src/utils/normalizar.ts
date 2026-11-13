export function normalizarNomeIngrediente(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function chaveIngrediente(nome: string): string {
  return normalizarNomeIngrediente(nome).normalize('NFD').replace(/[̀-ͯ]/g, '');
}
