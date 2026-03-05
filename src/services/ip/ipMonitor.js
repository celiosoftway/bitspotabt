// src/services/ipMonitor.js

const https = require("https");
const eventBus = require("./eventBus");

let lastIP = null;

function getPublicIP() {
  return new Promise((resolve, reject) => {

    https.get("https://api.ipify.org", res => {

      let data = "";

      res.on("data", chunk => data += chunk);

      res.on("end", () => {
        resolve(data.trim());
      });

    }).on("error", reject);

  });
}

async function checkIP() {

  try {

    const currentIP = await getPublicIP();

    if (!lastIP) {
      lastIP =  currentIP;
      console.log(`IP atual: ${currentIP}`);
      return;
    }

    if (currentIP !== lastIP) {

      console.log(`⚠️ Mudança de IP detectada: ${lastIP} → ${currentIP}`);

      eventBus.emit("ipChanged", {
        oldIP: lastIP,
        newIP: currentIP
      });

      lastIP = currentIP;

    }

  } catch (err) {
    console.error("Erro ao verificar IP:", err.message);
  }

}

function startIPMonitor(interval = 60000) {

  console.log("Monitor de IP iniciado");

  checkIP();

  setInterval(checkIP, interval);

}

module.exports = { startIPMonitor };