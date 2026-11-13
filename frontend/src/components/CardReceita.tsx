import { Link } from 'react-router-dom';
import type { Receita } from '../api/tipos';

export function FotoReceita({ receita, className }: { receita: Receita; className?: string }) {
  if (receita.fotoUrl) {
    return <img src={receita.fotoUrl} alt={receita.titulo} className={className} loading="lazy" />;
  }
  return (
    <div className={`${className ?? ''} foto-vazia`} aria-hidden>
      {receita.titulo.charAt(0).toUpperCase()}
    </div>
  );
}

export function CardReceita({ receita }: { receita: Receita }) {
  return (
    <Link to={`/receitas/${receita.id}`} className="card-receita">
      <FotoReceita receita={receita} className="card-foto" />
      <div className="card-corpo">
        {receita.categoria && <span className="etiqueta">{receita.categoria.nome}</span>}
        <h3>{receita.titulo}</h3>
        <p className="card-meta">
          {receita.tempoPreparo ? `${receita.tempoPreparo} min` : 'Tempo livre'}
          {receita.rendimento ? ` · ${receita.rendimento} ${receita.rendimento === 1 ? 'porção' : 'porções'}` : ''}
        </p>
      </div>
    </Link>
  );
}

export function GradeReceitas({ receitas }: { receitas: Receita[] }) {
  return (
    <div className="grade-receitas">
      {receitas.map((r) => (
        <CardReceita key={r.id} receita={r} />
      ))}
    </div>
  );
}
