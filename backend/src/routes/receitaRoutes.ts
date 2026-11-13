import { Router } from 'express';
import { ReceitaController } from '../controllers/ReceitaController';
import { autenticacao } from '../middlewares/autenticacao';

export const receitaRoutes = Router();

receitaRoutes.get('/busca', autenticacao, ReceitaController.buscar);
receitaRoutes.get('/minhas', autenticacao, ReceitaController.minhas); 

receitaRoutes.get('/', ReceitaController.listar);
receitaRoutes.get('/:id', ReceitaController.obter);

receitaRoutes.post('/', autenticacao, ReceitaController.criar); 
receitaRoutes.put('/:id', autenticacao, ReceitaController.atualizar);
receitaRoutes.delete('/:id', autenticacao, ReceitaController.excluir); 
