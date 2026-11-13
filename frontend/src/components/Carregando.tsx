export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="carregando" role="status">
      <span className="spinner" aria-hidden />
      {texto}
    </div>
  );
}
