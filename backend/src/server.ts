import { app } from './app';
import { env } from './config/env';
import { sequelize } from './models';

async function iniciar() {
  await sequelize.authenticate();
  app.listen(env.port, () => {
    console.log(`API do eRecipes ouvindo em http://localhost:${env.port}/api`);
  });
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar a API:', erro.message);
  process.exit(1);
});
