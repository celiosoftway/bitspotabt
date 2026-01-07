const sequelize = require('./database');
const { initConfig } = require('./services/configService');
const { startMonitoring } = require('./core/monitor');
const { startBot } = require('./bot');

async function main() {
  try {
    console.log('Iniciando BitSpot...');
    
    // Sincronizar Banco de Dados
    await sequelize.sync();
    console.log('Banco de dados sincronizado.');

    // Inicializar Configurações
    await initConfig();
    console.log('Configurações inicializadas.');

    // Iniciar Bot Telegram
    await startBot();

    // Iniciar Monitoramento
    startMonitoring();

  } catch (err) {
    console.error('Erro ao iniciar aplicação:', err);
  }
}

main();
