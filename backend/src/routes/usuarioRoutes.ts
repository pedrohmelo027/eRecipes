import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { autenticacao } from '../middlewares/autenticacao';
import { exigirPerfil } from '../middlewares/autorizacao';
import { TipoUsuario } from '../models';

export const usuarioRoutes = Router();

usuarioRoutes.use(autenticacao, exigirPerfil(TipoUsuario.ADMIN));

usuarioRoutes.get('/', UsuarioController.listar);
usuarioRoutes.put('/:id', UsuarioController.atualizar);
usuarioRoutes.patch('/:id/desativar', UsuarioController.desativar);
usuarioRoutes.patch('/:id/reativar', UsuarioController.reativar);
