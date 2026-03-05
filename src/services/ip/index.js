
const { startMonitoringIp } = require("./monitoring");

async function main() {
    try {
        console.log('Iniciando BitSpot...');

        startMonitoringIp();

    } catch (err) {
        console.error('Erro ao iniciar aplicação:', err);
    }
}

main();

