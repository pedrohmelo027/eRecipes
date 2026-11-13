import { z } from 'zod';
import { TipoUsuario } from '../models/Usuario';

const texto = (campo: string, max: number) =>
  z
    .string({ required_error: `${campo} é obrigatório`, invalid_type_error: `${campo} inválido` })
    .trim()
    .min(1, `${campo} é obrigatório`)
    .max(max, `${campo} deve ter no máximo ${max} caracteres`);

const email = z
  .string({ required_error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .min(1, 'E-mail é obrigatório')
  .email('E-mail em formato inválido')
  .max(150);

const senha = z
  .string({ required_error: 'Senha é obrigatória' })
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres');

const inteiroPositivoOpcional = (campo: string) =>
  z.coerce
    .number({ invalid_type_error: `${campo} deve ser um número` })
    .int(`${campo} deve ser um número inteiro`)
    .positive(`${campo} deve ser maior que zero`)
    .nullish();

export const cadastroSchema = z
  .object({
    nome: texto('Nome', 100),
    email,
    senha,
    confirmacaoSenha: z.string({ required_error: 'Confirme a senha' }),
  })
  .refine((d) => d.senha === d.confirmacaoSenha, {
    message: 'A confirmação não confere com a senha',
    path: ['confirmacaoSenha'],
  });

export const loginSchema = z.object({
  email: z.string({ required_error: 'E-mail é obrigatório' }).trim().toLowerCase().min(1, 'E-mail é obrigatório'),
  senha: z.string({ required_error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

const itemSchema = z
  .object({
    ingredienteId: z.coerce.number().int().positive().optional(),
    nome: z.string().trim().min(1).max(100).optional(),
    quantidade: z.coerce
      .number({ invalid_type_error: 'Quantidade deve ser um número' })
      .positive('Quantidade deve ser maior que zero')
      .max(999999.99)
      .nullish(),
    unidade: z.string().trim().max(30).nullish(),
  })
  .refine((i) => i.ingredienteId || i.nome, { message: 'Informe o ingrediente' });

export const receitaSchema = z.object({
  titulo: texto('Título', 150),
  categoriaId: z.coerce
    .number({ required_error: 'Escolha uma categoria', invalid_type_error: 'Escolha uma categoria' })
    .int()
    .positive('Escolha uma categoria'),
  modoPreparo: texto('Modo de preparo', 20000),
  tempoPreparo: inteiroPositivoOpcional('Tempo de preparo'),
  rendimento: inteiroPositivoOpcional('Rendimento'),
  fotoUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida para a foto')
    .max(255)
    .nullish()
    .or(z.literal('').transform(() => null)),
  itens: z
    .array(itemSchema, { required_error: 'Informe ao menos um ingrediente' })
    .min(1, 'Informe ao menos um ingrediente'),
});

const listaDeIds = z
  .string({ required_error: 'Informe ao menos um ingrediente' })
  .transform((s) => s.split(',').map((p) => p.trim()).filter(Boolean).map(Number))
  .pipe(
    z
      .array(z.number().int().positive('Ingrediente inválido'))
      .min(1, 'Informe ao menos um ingrediente'),
  );

export const buscaSchema = z.object({
  ingredientes: listaDeIds,
  categoria: z.coerce.number().int().positive().optional(),
});

export const listagemSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(12),
  categoria: z.coerce.number().int().positive().optional(),
});

export const idSchema = z.coerce.number().int().positive();

export const atualizarUsuarioSchema = z
  .object({
    nome: texto('Nome', 100).optional(),
    email: email.optional(),
    tipoUsuario: z.nativeEnum(TipoUsuario, { message: 'Perfil inválido' }).optional(),
  })
  .strict('Campo não permitido');

export const pesquisaSchema = z.object({ q: z.string().trim().max(100).optional() });

export type DadosCadastro = z.infer<typeof cadastroSchema>;
export type DadosReceitaEntrada = z.infer<typeof receitaSchema>;
export type DadosAtualizarUsuario = z.infer<typeof atualizarUsuarioSchema>;
