import type { ReactNode } from 'react';

export function Campo({
  rotulo,
  erro,
  dica,
  children,
}: {
  rotulo: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
}) {
  return (
    <label className={erro ? 'campo-com-erro' : undefined}>
      {rotulo}
      {children}
      {erro ? <span className="erro-campo">{erro}</span> : dica && <span className="dica-campo">{dica}</span>}
    </label>
  );
}
