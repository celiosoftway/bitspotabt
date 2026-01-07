const Config = require('../models/Config');

const DEFAULT_CONFIG = {
  banca: {
    amountBRL: 3000,
    minProfit: 10,
    minPercent: 0.3
  },
  exchanges: {
    Binance: true,
    Mexc: false,
    Bitget: false
  }
};

async function initConfig() {
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    await Config.findOrCreate({
      where: { key },
      defaults: { value }
    });
  }
}

async function getConfig(key) {
  const config = await Config.findOne({ where: { key } });
  return config ? config.value : DEFAULT_CONFIG[key];
}

async function setConfig(key, value) {
  await Config.upsert({ key, value });
}

async function defineBanca(amountBRL, minProfit, minPercent) {
  try {
    await setConfig("banca", {
      amountBRL,
      minProfit,
      minPercent
    });
    return 1;
  } catch (err) {
    console.error("Erro ao salvar banca:", err);
    return 0;
  }
}

async function getBanca() {
  return await getConfig("banca");
}

module.exports = { initConfig, getConfig, setConfig, getBanca, defineBanca };
