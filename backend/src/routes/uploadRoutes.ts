import express, { Router } from 'express';
import { autenticacao } from '../middlewares/autenticacao';
import { FotoService, TAMANHO_MAXIMO_FOTO } from '../services/FotoService';

export const uploadRoutes = Router();

uploadRoutes.post(
  '/',
  autenticacao,
  express.raw({ type: 'image/*', limit: TAMANHO_MAXIMO_FOTO }),
  async (req, res) => {
    res.status(201).json({ url: await FotoService.salvar(req.body) });
  },
);
