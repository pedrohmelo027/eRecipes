import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErroApi } from '../api/http';
import { Aviso } from '../components/Aviso';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const estado = location.state as { de?: string; mensagem?: string } | null;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
      navigate(estado?.de ?? '/buscar', { replace: true });
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : 'Não foi possível entrar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cartao-form">
      <h1>Entrar</h1>
      <p className="subtitulo">Acesse para buscar receitas pelos seus ingredientes.</p>
      <Aviso tipo="sucesso">{estado?.mensagem}</Aviso>
      <Aviso>{erro}</Aviso>
      <form onSubmit={handleSubmit} className="form">
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="botao botao-primario botao-largo" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="rodape-form">
        Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </section>
  );
}
