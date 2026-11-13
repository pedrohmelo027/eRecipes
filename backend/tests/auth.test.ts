import request from 'supertest';
import { app } from '../src/app';
import { criarUsuario, fecharBanco, resetarBanco } from './helpers';

beforeAll(resetarBanco);
afterAll(fecharBanco);

const cadastro = {
  nome: 'Maria',
  email: 'Maria@Email.com',
  senha: 'segredo123',
  confirmacaoSenha: 'segredo123',
};

describe('UC01 — Cadastrar-se', () => {
  it('cria a conta com perfil USUARIO e nunca devolve a senha', async () => {
    const res = await request(app).post('/api/auth/cadastro').send(cadastro);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: 'Maria', email: 'maria@email.com', tipoUsuario: 'USUARIO', ativo: true });
    expect(res.body).not.toHaveProperty('senhaHash');
    expect(res.body).not.toHaveProperty('senha');
  });

  it('recusa e-mail duplicado com 409 (RN01)', async () => {
    const res = await request(app).post('/api/auth/cadastro').send({ ...cadastro, email: 'maria@email.com' });
    expect(res.status).toBe(409);
    expect(res.body.campos).toHaveProperty('email');
  });

  it('recusa senha curta com 400 (RN02)', async () => {
    const res = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...cadastro, email: 'outra@email.com', senha: '123', confirmacaoSenha: '123' });
    expect(res.status).toBe(400);
    expect(res.body.campos).toHaveProperty('senha');
  });

  it('recusa confirmação diferente da senha', async () => {
    const res = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...cadastro, email: 'outra@email.com', confirmacaoSenha: 'diferente123' });
    expect(res.status).toBe(400);
    expect(res.body.campos).toHaveProperty('confirmacaoSenha');
  });
});

describe('UC02 — Fazer Login', () => {
  it('retorna token e usuário com credenciais corretas', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'maria@email.com', senha: 'segredo123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).not.toHaveProperty('senhaHash');

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('maria@email.com');
  });

  it('usa mensagem genérica para senha errada e e-mail inexistente', async () => {
    const senhaErrada = await request(app).post('/api/auth/login').send({ email: 'maria@email.com', senha: 'errada123' });
    const semConta = await request(app).post('/api/auth/login').send({ email: 'nada@email.com', senha: 'segredo123' });
    expect(senhaErrada.status).toBe(401);
    expect(semConta.status).toBe(401);
    expect(senhaErrada.body.erro).toBe(semConta.body.erro);
  });

  it('não deixa conta inativa logar (RN09)', async () => {
    const { usuario } = await criarUsuario({ ativo: false, senha: 'inativo123' });
    const res = await request(app).post('/api/auth/login').send({ email: usuario.email, senha: 'inativo123' });
    expect(res.status).toBe(403);
  });

  it('rejeita token de conta desativada depois do login', async () => {
    const { usuario, auth } = await criarUsuario();
    await usuario.update({ ativo: false });
    const res = await request(app).get('/api/auth/me').set('Authorization', auth);
    expect(res.status).toBe(401);
  });

  it('exige token nas rotas protegidas', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
