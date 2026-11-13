import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogoApi } from '../api/catalogoApi';
import { ErroApi } from '../api/http';
import { receitaApi } from '../api/receitaApi';
import type { Ingrediente, ReceitaEntrada } from '../api/tipos';
import { Aviso } from '../components/Aviso';
import { Campo } from '../components/Campo';
import { Carregando } from '../components/Carregando';
import { useCategorias } from '../components/FiltroCategorias';
import { useAuth } from '../contexts/AuthContext';

interface LinhaItem {
  chave: number;
  nome: string;
  quantidade: string;
  unidade: string;
}

interface Formulario {
  titulo: string;
  categoriaId: string;
  modoPreparo: string;
  tempoPreparo: string;
  rendimento: string;
  fotoUrl: string;
  itens: LinhaItem[];
}

let proximaChave = 1;
const novaLinha = (): LinhaItem => ({ chave: proximaChave++, nome: '', quantidade: '', unidade: '' });

const vazio = (): Formulario => ({
  titulo: '',
  categoriaId: '',
  modoPreparo: '',
  tempoPreparo: '',
  rendimento: '',
  fotoUrl: '',
  itens: [novaLinha()],
});

const UNIDADES = ['unidade', 'g', 'kg', 'ml', 'litro', 'xícara', 'colher de sopa', 'colher de chá', 'pitada', 'dente', 'lata', 'a gosto'];

const numeroOuNulo = (valor: string) => (valor.trim() === '' ? null : Number(valor.replace(',', '.')));


export function FormReceita() {
  const { id } = useParams();
  const editando = id !== undefined;
  const navigate = useNavigate();
  const { podeAlterar } = useAuth();
  const categorias = useCategorias();

  const [form, setForm] = useState<Formulario>(vazio);
  const [carregando, setCarregando] = useState(editando);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sugestoes, setSugestoes] = useState<Ingrediente[]>([]);

  useEffect(() => {
    if (!editando) return;
    receitaApi
      .obter(Number(id))
      .then((r) => {
        if (!podeAlterar(r)) {
          setErro('Você só pode editar as suas receitas.');
          return;
        }
        setForm({
          titulo: r.titulo,
          categoriaId: String(r.categoriaId),
          modoPreparo: r.modoPreparo,
          tempoPreparo: r.tempoPreparo?.toString() ?? '',
          rendimento: r.rendimento?.toString() ?? '',
          fotoUrl: r.fotoUrl ?? '',
          itens: (r.itens ?? []).map((i) => ({
            chave: proximaChave++,
            nome: i.ingrediente.nome,
            quantidade: i.quantidade?.toString() ?? '',
            unidade: i.unidade ?? '',
          })),
        });
      })
      .catch((e) => setErro(e instanceof ErroApi ? e.message : 'Erro ao carregar a receita'))
      .finally(() => setCarregando(false));
  }, [editando, id, podeAlterar]);

  function alterar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function alterarItem(chave: number, campo: keyof Omit<LinhaItem, 'chave'>, valor: string) {
    setForm((f) => ({ ...f, itens: f.itens.map((i) => (i.chave === chave ? { ...i, [campo]: valor } : i)) }));
    if (campo === 'nome' && valor.trim().length >= 2) {
      catalogoApi.ingredientes(valor).then(setSugestoes).catch(() => setSugestoes([]));
    }
  }

  function removerItem(chave: number) {
    setForm((f) => ({ ...f, itens: f.itens.filter((i) => i.chave !== chave) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCampos({});

    const dados: ReceitaEntrada = {
      titulo: form.titulo,
      categoriaId: form.categoriaId ? Number(form.categoriaId) : '',
      modoPreparo: form.modoPreparo,
      tempoPreparo: numeroOuNulo(form.tempoPreparo),
      rendimento: numeroOuNulo(form.rendimento),
      fotoUrl: form.fotoUrl.trim() || null,
      itens: form.itens
        .filter((i) => i.nome.trim())
        .map((i) => ({ nome: i.nome, quantidade: numeroOuNulo(i.quantidade), unidade: i.unidade || null })),
    };

    setSalvando(true);
    try {
      const salva = editando ? await receitaApi.atualizar(Number(id), dados) : await receitaApi.criar(dados);
      navigate(`/receitas/${salva.id}`, { replace: true });
    } catch (err) {
    
      if (err instanceof ErroApi) {
        setErro(err.message);
        setCampos(err.campos);
      } else {
        setErro('Não foi possível salvar a receita');
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;

  const erroDoItem = (indice: number) =>
    Object.entries(campos).find(([chave]) => chave.startsWith(`itens.${indice}`))?.[1];

  return (
    <section className="cartao-form cartao-form-largo">
      <h1>{editando ? 'Editar receita' : 'Nova receita'}</h1>
      <Aviso>{erro}</Aviso>

      <form onSubmit={handleSubmit} className="form" noValidate>
        <Campo rotulo="Título *" erro={campos.titulo}>
          <input value={form.titulo} onChange={(e) => alterar('titulo', e.target.value)} maxLength={150} autoFocus />
        </Campo>

        <div className="linha-campos">
          <Campo rotulo="Categoria *" erro={campos.categoriaId}>
            <select value={form.categoriaId} onChange={(e) => alterar('categoriaId', e.target.value)}>
              <option value="">Selecione…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Tempo (min)" erro={campos.tempoPreparo}>
            <input type="number" min={1} value={form.tempoPreparo} onChange={(e) => alterar('tempoPreparo', e.target.value)} />
          </Campo>
          <Campo rotulo="Porções" erro={campos.rendimento}>
            <input type="number" min={1} value={form.rendimento} onChange={(e) => alterar('rendimento', e.target.value)} />
          </Campo>
        </div>

        <fieldset className="grupo-itens">
          <legend>Ingredientes *</legend>
          {campos.itens && <span className="erro-campo">{campos.itens}</span>}
          <datalist id="lista-ingredientes">
            {sugestoes.map((s) => (
              <option key={s.id} value={s.nome} />
            ))}
          </datalist>
          <datalist id="lista-unidades">
            {UNIDADES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          {form.itens.map((item, indice) => (
            <div key={item.chave} className="linha-item">
              <input
                className="item-nome"
                placeholder="Ingrediente"
                list="lista-ingredientes"
                value={item.nome}
                onChange={(e) => alterarItem(item.chave, 'nome', e.target.value)}
                aria-label={`Ingrediente ${indice + 1}`}
              />
              <input
                className="item-qtd"
                placeholder="Qtd."
                inputMode="decimal"
                value={item.quantidade}
                onChange={(e) => alterarItem(item.chave, 'quantidade', e.target.value)}
                aria-label={`Quantidade do ingrediente ${indice + 1}`}
              />
              <input
                className="item-unidade"
                placeholder="Unidade"
                list="lista-unidades"
                value={item.unidade}
                onChange={(e) => alterarItem(item.chave, 'unidade', e.target.value)}
                aria-label={`Unidade do ingrediente ${indice + 1}`}
              />
              <button
                type="button"
                className="botao-icone"
                onClick={() => removerItem(item.chave)}
                disabled={form.itens.length === 1}
                aria-label={`Remover ingrediente ${indice + 1}`}
              >
                ×
              </button>
              {erroDoItem(indice) && <span className="erro-campo linha-item-erro">{erroDoItem(indice)}</span>}
            </div>
          ))}
          <button type="button" className="botao botao-fantasma" onClick={() => alterar('itens', [...form.itens, novaLinha()])}>
            + Adicionar ingrediente
          </button>
        </fieldset>

        <Campo rotulo="Modo de preparo *" erro={campos.modoPreparo}>
          <textarea rows={8} value={form.modoPreparo} onChange={(e) => alterar('modoPreparo', e.target.value)} />
        </Campo>

        <Campo rotulo="URL da foto (opcional)" erro={campos.fotoUrl}>
          <input type="url" placeholder="https://…" value={form.fotoUrl} onChange={(e) => alterar('fotoUrl', e.target.value)} />
        </Campo>

        <div className="acoes">
          <button className="botao botao-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Publicar receita'}
          </button>
          <button type="button" className="botao botao-fantasma" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
