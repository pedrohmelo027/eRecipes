import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ErroApi } from '../api/http';
import type { TipoUsuario, Usuario } from '../api/tipos';
import { usuarioApi } from '../api/usuarioApi';
import { Aviso } from '../components/Aviso';
import { Carregando } from '../components/Carregando';
import { useAuth } from '../contexts/AuthContext';

interface Edicao {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
}


export function AdminUsuarios() {
  const { usuario: eu } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [termo, setTermo] = useState('');
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback((q?: string) => {
    usuarioApi
      .listar(q)
      .then(setUsuarios)
      .catch((e) => setErro(e instanceof ErroApi ? e.message : 'Erro ao carregar usuários'));
  }, []);

  useEffect(() => carregar(), [carregar]);

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    carregar(termo);
  }

  function substituir(atualizado: Usuario) {
    setUsuarios((lista) => lista?.map((u) => (u.id === atualizado.id ? atualizado : u)) ?? null);
  }

  async function executar(acao: () => Promise<Usuario>, mensagem: string) {
    setErro('');
    setSucesso('');
    try {
      substituir(await acao());
      setSucesso(mensagem);
      return true;
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro ao salvar');
      return false;
    }
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!edicao) return;
    const { id, ...dados } = edicao;
    if (await executar(() => usuarioApi.atualizar(id, dados), 'Usuário atualizado.')) setEdicao(null);
  }

  function alternarStatus(u: Usuario) {
    if (u.ativo) {
      if (!window.confirm(`Desativar a conta de ${u.nome}? Ela não poderá mais entrar e suas receitas somem das buscas.`)) return;
      executar(() => usuarioApi.desativar(u.id), `${u.nome} foi desativado.`);
    } else {
      executar(() => usuarioApi.reativar(u.id), `${u.nome} foi reativado.`);
    }
  }

  return (
    <>
      <section className="cabecalho-pagina">
        <h1>Usuários</h1>
        <p className="subtitulo">Edite perfis e desative ou reative contas. Contas nunca são excluídas.</p>
      </section>

      <form className="painel-busca" onSubmit={pesquisar}>
        <input
          className="campo-pesquisa"
          placeholder="Pesquisar por nome ou e-mail"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          aria-label="Pesquisar usuários"
        />
        <button className="botao botao-secundario">Pesquisar</button>
      </form>

      <Aviso>{erro}</Aviso>
      <Aviso tipo="sucesso">{sucesso}</Aviso>
      {!usuarios && !erro && <Carregando />}

      {usuarios && (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="vazio">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {usuarios.map((u) => {
                const souEu = u.id === eu?.id;
                if (edicao?.id === u.id) {
                  return (
                    <tr key={u.id} className="linha-edicao">
                      <td>
                        <input value={edicao.nome} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} aria-label="Nome" />
                      </td>
                      <td>
                        <input type="email" value={edicao.email} onChange={(e) => setEdicao({ ...edicao, email: e.target.value })} aria-label="E-mail" />
                      </td>
                      <td>
                        <select
                          value={edicao.tipoUsuario}
                          disabled={souEu}
                          onChange={(e) => setEdicao({ ...edicao, tipoUsuario: e.target.value as TipoUsuario })}
                          aria-label="Perfil"
                        >
                          <option value="USUARIO">Usuário</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>{u.ativo ? 'Ativo' : 'Inativo'}</td>
                      <td className="acoes-tabela">
                        <button className="botao botao-primario botao-pequeno" onClick={salvarEdicao}>
                          Salvar
                        </button>
                        <button className="botao botao-fantasma botao-pequeno" onClick={() => setEdicao(null)}>
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={u.id} className={u.ativo ? undefined : 'linha-inativa'}>
                    <td>
                      {u.nome} {souEu && <span className="etiqueta">você</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.tipoUsuario === 'ADMIN' ? 'Admin' : 'Usuário'}</td>
                    <td>
                      <span className={`status ${u.ativo ? 'status-ativo' : 'status-inativo'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="acoes-tabela">
                      <button
                        className="botao botao-fantasma botao-pequeno"
                        onClick={() => setEdicao({ id: u.id, nome: u.nome, email: u.email, tipoUsuario: u.tipoUsuario })}
                      >
                        Editar
                      </button>
                      {!souEu && (
                        <button
                          className={`botao botao-pequeno ${u.ativo ? 'botao-perigo' : 'botao-secundario'}`}
                          onClick={() => alternarStatus(u)}
                        >
                          {u.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
