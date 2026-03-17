require('dotenv').config();
const sequelize = require('./database');
const { initConfig } = require('./services/configService');

const { startMonitoring } = require('./core/monitorv2');
const { startBot } = require('./bot');

async function startApp() {

    console.log("🚀 Iniciando aplicação...");

    try {
        // Sincronizar Banco de Dados
        await sequelize.sync();
        //await sequelize.sync({ force: true });

        console.log('Banco de dados sincronizado.');

        // inicia bot telegram
        await startBot();

        // inicia monitor
        startMonitoring();

        console.log("✅ Sistema iniciado");

    } catch (err) {

        console.error("Erro ao iniciar aplicação:", err.message);

    }

}

startApp();