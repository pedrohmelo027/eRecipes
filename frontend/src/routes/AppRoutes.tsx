import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AdminUsuarios } from '../pages/AdminUsuarios';
import { BuscarReceitas } from '../pages/BuscarReceitas';
import { Cadastro } from '../pages/Cadastro';
import { DetalheReceita } from '../pages/DetalheReceita';
import { FormReceita } from '../pages/FormReceita';
import { Inicio } from '../pages/Inicio';
import { Login } from '../pages/Login';
import { MinhasReceitas } from '../pages/MinhasReceitas';
import { NaoEncontrada } from '../pages/NaoEncontrada';
import { RotaPrivada } from './RotaPrivada';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Cadastro />} />
        <Route path="receitas/:id" element={<DetalheReceita />} />

        <Route element={<RotaPrivada />}>
          <Route path="buscar" element={<BuscarReceitas />} />
          <Route path="minhas-receitas" element={<MinhasReceitas />} />
          <Route path="receitas/nova" element={<FormReceita />} />
          <Route path="receitas/:id/editar" element={<FormReceita />} />
        </Route>

        <Route element={<RotaPrivada apenasAdmin />}>
          <Route path="admin/usuarios" element={<AdminUsuarios />} />
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
