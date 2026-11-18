import { DataTypes, QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';
import { UNIDADES } from '../../models/Unidade';

const CONVERSOES: { de: string[]; para: string | null; fator?: number; semQuantidade?: boolean }[] = [
  { de: ['colher de sopa'], para: 'ml', fator: 15 },
  { de: ['colher de chá'], para: 'ml', fator: 5 },
  { de: ['colher de café'], para: 'ml', fator: 2.5 },
  { de: ['mg'], para: 'g', fator: 0.001 },
  {
    de: ['dente', 'fatia', 'pedaço', 'folha', 'ramo', 'maço', 'pé', 'lata', 'pacote', 'caixa', 'vidro', 'sachê'],
    para: 'unidade',
  },
  { de: ['a gosto', 'pitada', 'gota'], para: null, semQuantidade: true },
];

const ANTIGAS = [
  'unidade', 'g', 'kg', 'mg', 'ml', 'litro', 'xícara', 'copo', 'colher de sopa', 'colher de chá',
  'colher de café', 'pitada', 'gota', 'dente', 'fatia', 'pedaço', 'folha', 'ramo', 'maço', 'pé',
  'lata', 'pacote', 'caixa', 'vidro', 'sachê', 'a gosto',
];

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  for (const { de, para, fator, semQuantidade } of CONVERSOES) {
    await qi.sequelize.query(
      `UPDATE item_receita
          SET unidade = :para,
              quantidade = ${semQuantidade ? 'NULL' : fator ? 'ROUND(quantidade * :fator, 2)' : 'quantidade'}
        WHERE unidade IN (:de)`,
      { replacements: { de, para, fator: fator ?? 1 } },
    );
  }
  await qi.sequelize.query('UPDATE item_receita SET unidade = NULL WHERE unidade NOT IN (:unidades)', {
    replacements: { unidades: UNIDADES },
  });
  await qi.changeColumn('item_receita', 'unidade', { type: DataTypes.ENUM(...UNIDADES), allowNull: true });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.changeColumn('item_receita', 'unidade', { type: DataTypes.ENUM(...ANTIGAS), allowNull: true });
};
