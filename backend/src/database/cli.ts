import { sequelize } from '../models';
import { migrator, seeder } from './migrator';

/**
 * Liga o RLS (sem políticas) em todas as tabelas do schema public. No Supabase isso impede que a API REST
 * pública (chave anon) leia ou altere as tabelas; o backend conecta como dono delas e não é afetado.
 */
async function protegerTabelas() {
  await sequelize.query(`
    DO $$ DECLARE t record; BEGIN
      FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
      END LOOP;
    END $$;`);
}

async function main() {
  const comando = process.argv[2];
  switch (comando) {
    case 'migrate': {
      const feitas = await migrator.up();
      await protegerTabelas();
      console.log(feitas.length ? `Migrations aplicadas: ${feitas.map((m) => m.name).join(', ')}` : 'Nenhuma migration pendente');
      break;
    }
    case 'migrate:undo': {
      const desfeitas = await migrator.down();
      console.log(desfeitas.length ? `Migration desfeita: ${desfeitas[0].name}` : 'Nada a desfazer');
      break;
    }
    case 'seed': {
      const feitos = await seeder.up();
      await protegerTabelas();
      console.log(feitos.length ? `Seeds aplicados: ${feitos.map((s) => s.name).join(', ')}` : 'Nenhum seed pendente');
      break;
    }
    default:
      console.error('Uso: cli.ts <migrate | migrate:undo | seed>');
      process.exitCode = 1;
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
