const { getConfig } = require('../services/configService');
const priceService = require('../services/priceService');
const Snapshot = require('../models/Snapshot');
const { Telegraf } = require('telegraf');
require('dotenv').config();

// const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = process.env.OWNER_ID;

const { enviarMensagemTelegram } = require('../utils/util');
const { getUsdBrlPrice } = require('../services/oracleService');
const simulationService = require('../services/simulation.service');

const debug = true;
let count = 0;

const strategies = [
  { label: 100, factor: 1 }
  // { label: 75, factor: 0.75 },
  // { label: 50, factor: 0.5 }
];

let strategyIndex = 0;
let lastTradeTime = 0;
let tradeInProgress = false;

async function runMonitor(p_chamada) {
  try {

    const isBotCall = p_chamada === "bot";

    if (debug) console.log("01 - Iniciando monitoramento");

    const exchangesConfig = await getConfig('exchanges');
    const banca = await getConfig('banca');

    const baseAmountBRL = banca.amountBRL;
    const { minProfit, minPercent } = banca;

    const strategy = strategies[strategyIndex];
    let amountBRL = baseAmountBRL;

    if (!isBotCall) {
      strategyIndex = (strategyIndex + 1) % strategies.length;
      amountBRL = baseAmountBRL * strategy.factor;
    }

    console.log(`amountBRL: ${amountBRL} strategy.factor: ${strategy.factor} strategyIndex:${strategyIndex}`);

    // ================= CEX =================

    if (debug) console.log("02 - buscando preço CEX");

    const cexPrices = [];
    if (exchangesConfig.Binance) cexPrices.push({ name: 'Binance', price: await priceService.getBinancePrice() });
    if (exchangesConfig.Mexc) cexPrices.push({ name: 'Mexc', price: await priceService.getMexcPrice() });
    if (exchangesConfig.Bitget) cexPrices.push({ name: 'Bitget', price: await priceService.getBitgetPrice() });

    const validCex = cexPrices.filter(c => c.price);
    if (!validCex.length) return;

    const bestCex = validCex.reduce((a, b) => a.price < b.price ? a : b);
    const amountUSDT = amountBRL / bestCex.price;

    // ================= DEX =================

    if (debug) console.log("05 - Iniciando cotação DEX");

    const dexQuotesRaw = await Promise.all([
      priceService.getParaSwapQuote(amountUSDT),
      priceService.getKyberQuote(amountUSDT),
      priceService.getOdosQuote(amountUSDT)
    ]);

    const dexQuotes = [
      { name: 'ParaSwap', value: dexQuotesRaw[0] },
      { name: 'KyberSwap', value: dexQuotesRaw[1] },
      { name: 'Odos', value: dexQuotesRaw[2] }
    ];

    const validDex = dexQuotes
      .filter(d => d.value)
      .map(d => ({
        ...d,
        profit: d.value - amountBRL,
        percent: ((d.value - amountBRL) / amountBRL) * 100
      }));

    if (!validDex.length) return;

    const bestDex = validDex.reduce((a, b) => a.value > b.value ? a : b);

    // ================= ORACLE =================

    if (debug) console.log("07 - Oracle");

    const chainlinkPrice = await getUsdBrlPrice();

    const cexUnitPrice = bestCex.price;
    const dexUnitPrice = bestDex.value / amountUSDT;
    const oracleTotalBRL = amountUSDT * chainlinkPrice;

    const oracleDeviation =
      ((dexUnitPrice - chainlinkPrice) / chainlinkPrice) * 100;

    // ================= RESULT =================

    const result = {
      timestamp: new Date().toISOString(),
      strategy: strategy.label,

      bancaBRL: baseAmountBRL,
      amountBRL,

      exchange: bestCex.name,
      amountUSDT: parseFloat(amountUSDT.toFixed(2)),

      dexName: bestDex.name,
      dexPrice: parseFloat(bestDex.value.toFixed(2)),

      cexUnitPrice: parseFloat(cexUnitPrice.toFixed(4)),
      dexUnitPrice: parseFloat(dexUnitPrice.toFixed(4)),
      dexTotalBRL: parseFloat(bestDex.value.toFixed(2)),

      oracleUnitPrice: parseFloat(chainlinkPrice.toFixed(4)),
      oracleTotalBRL: parseFloat(oracleTotalBRL.toFixed(2)),
      oracleDeviation: parseFloat(oracleDeviation.toFixed(2)),

      profit: parseFloat(bestDex.profit.toFixed(2)),
      percent: parseFloat(bestDex.percent.toFixed(2))
    };

    // ================= SNAPSHOT =================

    if (!isBotCall) {
      await Snapshot.create(result);
    }

    // ================= TRADE CONTROL =================

    const cooldownMinutes = parseInt(process.env.TRADE_COOLDOWN_MINUTES || "5");
    const cooldownMs = cooldownMinutes * 60 * 1000;

    const now = Date.now();
    const timeSinceLastTrade = now - lastTradeTime;

    const canExecuteByTime = timeSinceLastTrade >= cooldownMs;
    const meetsCriteria =
      (result.profit >= minProfit || result.percent >= minPercent);

    const canStartTrade =
      !isBotCall &&
      meetsCriteria &&
      !tradeInProgress &&
      canExecuteByTime;

    if (OWNER_ID && canStartTrade) {

      tradeInProgress = true;

      try {

        const simulation = await simulationService.registerTrade(result, baseAmountBRL);

        if (!simulation) {
          return; // não atualiza cooldown
        }

        const msg =
          `🚀 *Oportunidade Detectada!*\n\n` +
          `🏦 Banca: R$ ${result.bancaBRL}\n` +
          `🎯 Usado: R$ ${result.amountBRL}\n` +
          `💰 Lucro: R$ ${result.profit} (${result.percent}%)\n\n` +
          `📥 ${result.amountUSDT} USDT na ${result.exchange}\n` +
          `Unit: R$ ${result.cexUnitPrice}\n\n` +
          `📤 ${result.dexName}\n` +
          `Unit: R$ ${result.dexUnitPrice}\n` +
          `Total: R$ ${result.dexTotalBRL}\n\n` +
          `🔮 Oracle: R$ ${result.oracleUnitPrice}\n` +
          `📐 Desvio: ${result.oracleDeviation}%\n\n` +
          `🕒 ${result.timestamp}`;

        await enviarMensagemTelegram(msg);

        // só atualiza cooldown se realmente executou
        // FUTURO:
        // await executarTradeCompleto();
        // tradeInProgress = false;
        
        lastTradeTime = Date.now();

      } catch (err) {
        console.error("Erro na execução do trade:", err.message);
      } finally {
        tradeInProgress = false;
      }
    }


    // ================= LOGS =================

    console.log(`\n💰 [${result.timestamp}] ${result.exchange} → ${result.dexName}`);
    console.log(`Lucro: R$ ${result.profit} (${result.percent}%)`);
    console.log(`Oracle desvio: ${result.oracleDeviation}%`);

    return result;

  } catch (err) {
    console.error('Erro no monitor:', err.message);
  }
}


let intervalId = null;

function startMonitoring(intervalMs = 60000) {
  if (intervalId) return;
  runMonitor();
  intervalId = setInterval(runMonitor, intervalMs);
  console.log('Monitoramento iniciado.');
}

function stopMonitoring() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('Monitoramento parado.');
  }
}

module.exports = { startMonitoring, stopMonitoring, runMonitor };
