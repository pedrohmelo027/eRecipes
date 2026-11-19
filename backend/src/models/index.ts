import { sequelize } from '../config/database';
import { Categoria } from './Categoria';
import { Ingrediente } from './Ingrediente';
import { ItemReceita } from './ItemReceita';
import { Receita } from './Receita';
import { Sinonimo } from './Sinonimo';
import { TipoUsuario, Usuario } from './Usuario';

Usuario.hasMany(Receita, { foreignKey: 'usuarioId', as: 'receitas' });
Receita.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'autor' });

Categoria.hasMany(Receita, { foreignKey: 'categoriaId', as: 'receitas' });
Receita.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });

Receita.hasMany(ItemReceita, { foreignKey: 'receitaId', as: 'itens', onDelete: 'CASCADE' });
ItemReceita.belongsTo(Receita, { foreignKey: 'receitaId', as: 'receita' });

Ingrediente.hasMany(ItemReceita, { foreignKey: 'ingredienteId', as: 'itens', onDelete: 'RESTRICT' });
ItemReceita.belongsTo(Ingrediente, { foreignKey: 'ingredienteId', as: 'ingrediente' });

// Auto-associação "sinonimo" do diagrama de classes.
Ingrediente.belongsTo(Ingrediente, { foreignKey: 'sinonimoId', as: 'sinonimo', onDelete: 'SET NULL' });

Receita.includeCompleto = [
  { model: Categoria, as: 'categoria' },
  { model: Usuario, as: 'autor', attributes: ['id', 'nome'] },
  {
    model: ItemReceita,
    as: 'itens',
    attributes: ['quantidade', 'unidade'],
    include: [{ model: Ingrediente, as: 'ingrediente', attributes: ['id', 'nome'] }],
  },
];

export { sequelize, Categoria, Ingrediente, ItemReceita, Receita, Sinonimo, TipoUsuario, Usuario };
