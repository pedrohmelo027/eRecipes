import { sequelize } from '../models';
import { migrator, seeder } from './migrator';

async function main() {
  const comando = process.argv[2];
  switch (comando) {
    case 'migrate': {
      const feitas = await migrator.up();
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
