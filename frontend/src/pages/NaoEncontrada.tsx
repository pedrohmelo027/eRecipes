import { Link } from 'react-router-dom';

export function NaoEncontrada() {
  return (
    <div className="vazio">
      <h1>Página não encontrada</h1>
      <Link to="/">Voltar ao início</Link>
    </div>
  );
}
