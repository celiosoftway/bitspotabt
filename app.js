require('dotenv').config();
const sequelize = require('./src/database');
const { initConfig } = require('./src/services/configService');

const { startMonitoring } = require('./src/core/monitorv2');
const { startBot } = require('./src/bot');

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