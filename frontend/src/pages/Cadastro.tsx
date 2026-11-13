import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DadosCadastro } from '../api/authApi';
import { authApi } from '../api/authApi';
import { ErroApi } from '../api/http';
import { Aviso } from '../components/Aviso';
import { Campo } from '../components/Campo';

const vazio: DadosCadastro = { nome: '', email: '', senha: '', confirmacaoSenha: '' };

export function Cadastro() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(vazio);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const alterar = (campo: keyof DadosCadastro) => (e: ChangeEvent<HTMLInputElement>) =>
    setDados((d) => ({ ...d, [campo]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCampos({});

  
    const locais: Record<string, string> = {};
    if (dados.senha.length < 8) locais.senha = 'A senha deve ter no mínimo 8 caracteres';
    if (dados.senha !== dados.confirmacaoSenha) locais.confirmacaoSenha = 'A confirmação não confere com a senha';
    if (Object.keys(locais).length) {
      setCampos(locais);
      return;
    }

    setEnviando(true);
    try {
      await authApi.cadastrar(dados);
      navigate('/login', { state: { mensagem: 'Conta criada! Faça login para continuar.' } });
    } catch (err) {
      if (err instanceof ErroApi) {
        setErro(err.message);
        setCampos(err.campos);
      } else {
        setErro('Não foi possível criar a conta');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cartao-form">
      <h1>Criar conta</h1>
      <p className="subtitulo">Cadastre-se para buscar e publicar receitas.</p>
      <Aviso>{erro}</Aviso>
      <form onSubmit={handleSubmit} className="form" noValidate>
        <Campo rotulo="Nome" erro={campos.nome}>
          <input value={dados.nome} onChange={alterar('nome')} required autoComplete="name" autoFocus />
        </Campo>
        <Campo rotulo="E-mail" erro={campos.email}>
          <input type="email" value={dados.email} onChange={alterar('email')} required autoComplete="email" />
        </Campo>
        <Campo rotulo="Senha" erro={campos.senha} dica="Mínimo de 8 caracteres">
          <input type="password" value={dados.senha} onChange={alterar('senha')} required autoComplete="new-password" />
        </Campo>
        <Campo rotulo="Confirmar senha" erro={campos.confirmacaoSenha}>
          <input type="password" value={dados.confirmacaoSenha} onChange={alterar('confirmacaoSenha')} required autoComplete="new-password" />
        </Campo>
        <button className="botao botao-primario botao-largo" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Cadastrar'}
        </button>
      </form>
      <p className="rodape-form">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </section>
  );
}
