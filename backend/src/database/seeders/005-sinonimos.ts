import type { MigrationFn } from 'umzug';
import type { Sequelize } from 'sequelize';
import { Ingrediente, sequelize } from '../../models';

// Cada grupo reúne nomes do mesmo ingrediente; nenhum deles é o "principal".
export const GRUPOS_SINONIMOS: string[][] = [
  ['mandioca', 'aipim', 'macaxeira'],
  ['abóbora', 'jerimum'],
  ['tangerina', 'mexerica', 'bergamota'],
  ['farinha de trigo', 'trigo'],
  ['pão francês', 'pão de sal', 'cacetinho', 'pão careca'],
  ['biscoito', 'bolacha'],
  ['salsa', 'salsinha'],
  ['aipo', 'salsão'],
  ['amendoim', 'minduim'],
  ['extrato de tomate', 'massa de tomate'],
  ['óleo', 'óleo de soja', 'óleo vegetal'],
  ['sal', 'sal refinado'],
  ['açúcar', 'açúcar refinado'],
  ['milho', 'milho verde'],
  ['pimenta-do-reino', 'pimenta do reino'],
];

const CORRECOES: Record<string, string> = { maça: 'maçã' };

export const up: MigrationFn<Sequelize> = async () => {
  await sequelize.transaction(async (transaction) => {
    for (const [errado, certo] of Object.entries(CORRECOES)) {
      await sequelize.query('UPDATE ingrediente SET nome = :certo WHERE nome COLLATE "C" = :errado', {
        replacements: { certo, errado },
        transaction,
      });
    }
    for (const [primeiro, ...outros] of GRUPOS_SINONIMOS) {
      for (const outro of outros) await Ingrediente.registrarSinonimo(primeiro, outro, transaction);
    }
  });
};

export const down: MigrationFn<Sequelize> = async () => {};
