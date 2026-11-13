import request from 'supertest';
import { app } from '../src/app';
import { TipoUsuario, Usuario } from '../src/models';
import { UsuarioService } from '../src/services/UsuarioService';
import { criarUsuario, fecharBanco, resetarBanco } from './helpers';

let admin: Awaited<ReturnType<typeof criarUsuario>>;
let comum: Awaited<ReturnType<typeof criarUsuario>>;

beforeAll(async () => {
  await resetarBanco();
  admin = await criarUsuario({ tipoUsuario: TipoUsuario.ADMIN });
  comum = await criarUsuario();
});
afterAll(fecharBanco);

describe('UC05 — Manter Usuários', () => {
  it('bloqueia as rotas de admin para USUARIO (403)', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', comum.auth);
    expect(res.status).toBe(403);
  });

  it('lista e pesquisa usuários sem expor senha', async () => {
    const res = await request(app).get(`/api/usuarios?q=${encodeURIComponent(comum.usuario.email)}`).set('Authorization', admin.auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).not.toHaveProperty('senhaHash');
  });

  it('edita nome e perfil', async () => {
    const res = await request(app)
      .put(`/api/usuarios/${comum.usuario.id}`)
      .set('Authorization', admin.auth)
      .send({ nome: 'Novo Nome' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Novo Nome');
  });

  it('recusa e-mail já em uso (409)', async () => {
    const res = await request(app)
      .put(`/api/usuarios/${comum.usuario.id}`)
      .set('Authorization', admin.auth)
      .send({ email: admin.usuario.email });
    expect(res.status).toBe(409);
  });

  it('não permite alterar a senha de outro usuário (RN11)', async () => {
    const res = await request(app)
      .put(`/api/usuarios/${comum.usuario.id}`)
      .set('Authorization', admin.auth)
      .send({ senha: 'novasenha123' });
    expect(res.status).toBe(400);
  });

  it('desativa e reativa uma conta (RN09)', async () => {
    const des = await request(app).patch(`/api/usuarios/${comum.usuario.id}/desativar`).set('Authorization', admin.auth);
    expect(des.status).toBe(200);
    expect(des.body.ativo).toBe(false);
    expect(await Usuario.count({ where: { id: comum.usuario.id } })).toBe(1);

    const rea = await request(app).patch(`/api/usuarios/${comum.usuario.id}/reativar`).set('Authorization', admin.auth);
    expect(rea.body.ativo).toBe(true);
  });

  it('Admin não desativa a si mesmo nem remove o próprio perfil (RN10)', async () => {
    const des = await request(app).patch(`/api/usuarios/${admin.usuario.id}/desativar`).set('Authorization', admin.auth);
    const rebaixa = await request(app)
      .put(`/api/usuarios/${admin.usuario.id}`)
      .set('Authorization', admin.auth)
      .send({ tipoUsuario: 'USUARIO' });
    expect(des.status).toBe(400);
    expect(rebaixa.status).toBe(400);
  });

  it('não permite desativar nem rebaixar o último Admin ativo (RN10)', async () => {
    expect(await Usuario.count({ where: { tipoUsuario: TipoUsuario.ADMIN, ativo: true } })).toBe(1);
    const outroAtor = comum.usuario.id;
    await expect(UsuarioService.desativar(outroAtor, admin.usuario.id)).rejects.toThrow('ao menos um Admin ativo');
    await expect(
      UsuarioService.atualizar(outroAtor, admin.usuario.id, { tipoUsuario: TipoUsuario.USUARIO }),
    ).rejects.toThrow('ao menos um Admin ativo');
  });

  it('permite desativar um Admin quando há outro ativo', async () => {
    const segundo = await criarUsuario({ tipoUsuario: TipoUsuario.ADMIN });
    const res = await request(app).patch(`/api/usuarios/${segundo.usuario.id}/desativar`).set('Authorization', admin.auth);
    expect(res.status).toBe(200);
  });
});
