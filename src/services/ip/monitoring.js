// src/core/monitoring.js

const { startIPMonitor } = require("./ipMonitor");
const eventBus = require("./eventBus");

function startMonitoringIp() {

  console.log("Iniciando monitoramento...");

  startIPMonitor(60000);

  eventBus.on("ipChanged", handleIPChange);

}

async function handleIPChange({ oldIP, newIP }) {

  console.log("Executando rotina de segurança...");

  pauseBots();

  await notifyTelegram(oldIP, newIP);

}

function pauseBots() {

  console.log("⛔ Bots pausados devido mudança de IP");

  // aqui você chama seu gerenciador de bots
  // exemplo:
  // botManager.pauseAll()

}

async function notifyTelegram(oldIP, newIP) {

  try {

    const message = `
⚠️ Mudança de IP detectada

Antigo: ${oldIP}
Novo: ${newIP}

Bots pausados aguardando whitelist
`;

    console.log("Enviar alerta Telegram");

    // aqui você pode usar seu serviço existente
    // ex:
    // telegramService.send(message)

  } catch (err) {

    console.error("Erro ao enviar alerta Telegram:", err.message);

  }

}

module.exports = { startMonitoringIp };