const { getConfig } = require('../services/configService');
const priceService = require('../services/priceService');
const Snapshot = require('../models/Snapshot');
const { Telegraf } = require('telegraf');
require('dotenv').config();

// const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = process.env.OWNER_ID;

const { enviarMensagemTelegram } = require('../utils/util');
const { getUsdBrlPrice } = require('../services/oracleService');

const debug = true;
let count = 0;

const strategies = [
  { label: 100, factor: 1 },
  { label: 75, factor: 0.75 },
  { label: 50, factor: 0.5 }
];

let strategyIndex = 0;


async function runMonitor(p_chamada) {
  try {

    let bot = false;
    if (p_chamada === "bot") {
      bot = true;
    }

    if (debug) { console.log("01 - Iniciando monitoramento") }

    const exchangesConfig = await getConfig('exchanges');
    const banca = await getConfig('banca');
    const baseAmountBRL = banca.amountBRL;
    const { minProfit, minPercent } = banca;

    const strategy = strategies[strategyIndex];
    let amountBRL = baseAmountBRL;

    if (!bot) {
      strategyIndex = (strategyIndex + 1) % strategies.length;
      amountBRL = baseAmountBRL * strategy.factor;
    }

    console.log(`amountBRL: ${amountBRL} strategy.factor: ${strategy.factor} strategyIndex:${strategyIndex}`)

    if (debug) { console.log("02 - buscando preço CEX") }

    // 1. Buscar preços CEX
    const cexPrices = [];
    if (exchangesConfig.Binance) cexPrices.push({ name: 'Binance', price: await priceService.getBinancePrice() });
    if (exchangesConfig.Mexc) cexPrices.push({ name: 'Mexc', price: await priceService.getMexcPrice() });
    if (exchangesConfig.Bitget) cexPrices.push({ name: 'Bitget', price: await priceService.getBitgetPrice() });

    if (debug) { console.log("03 - Validando CEX") }

    const validCex = cexPrices.filter(c => c.price);
    if (validCex.length === 0) return;

    if (debug) { console.log("04 - Definindo melhor cotação CEX") }

    // Melhor compra (menor preço CEX = mais USDT por BRL)
    const bestCex = validCex.reduce((prev, curr) => (prev.price < curr.price ? prev : curr));
    const amountUSDT = amountBRL / bestCex.price;

    if (debug) { console.log("05 - Iniciando cotação DEX") }

    // 2. Buscar cotações DEX
    const dexQuotes = await Promise.all([
      { name: 'ParaSwap', value: await priceService.getParaSwapQuote(amountUSDT) },
      { name: 'KyberSwap', value: await priceService.getKyberQuote(amountUSDT) },
      { name: 'Odos', value: await priceService.getOdosQuote(amountUSDT) }
    ]);

    if (debug) { console.log("06 - Validando DEX") }

    const validDex = dexQuotes.filter(d => d.value).map(d => ({
      ...d,
      profit: d.value - amountBRL,
      percent: ((d.value - amountBRL) / amountBRL) * 100
    }));

    if (validDex.length === 0) return;

    if (debug) { console.log("07 - Definindo melhor DEX") }

    // Melhor venda (maior valor DEX)
    const bestDex = validDex.reduce((prev, curr) => (prev.value > curr.value ? prev : curr));

    const result = {
      timestamp: new Date().toISOString(),

      strategy: strategy.label,

      // 🔑 capital
      bancaBRL: baseAmountBRL,        // valor configurado
      amountBRL: amountBRL,           // valor usado na simulação

      // 🔄 execução
      exchange: bestCex.name,
      amountUSDT: parseFloat(amountUSDT.toFixed(2)),

      // 📤 DEX
      dexName: bestDex.name,
      dexPrice: parseFloat(bestDex.value.toFixed(2)),

      // 📊 resultado
      profit: parseFloat(bestDex.profit.toFixed(2)),
      percent: parseFloat(bestDex.percent.toFixed(2))
    };

    if (debug) { console.log("08 - Salvando snapshot") }

    // 3. Salvar Snapshot
    if (!bot) {await Snapshot.create(result)};

    if (debug) { console.log("09 - Validando alerta Telegram") }

    // 4. Alerta Telegram se lucrativo
    if (result.profit >= minProfit || result.percent >= minPercent && !bot) {
      console.log("count:", count)

      const msg = `🚀 *Oportunidade Detectada!*\n\n` +
        `💰 Lucro: R$ ${result.profit} (${result.percent}%)\n` +
        `📥 Compra: ${result.amountUSDT} USDT na ${result.exchange}\n` +
        `📤 Venda: ${result.dexName}\n` +
        `🕒 ${result.timestamp}`;

      if (OWNER_ID && count === 0) {
        // await bot.telegram.sendMessage(OWNER_ID, msg, { parse_mode: 'Markdown' });
        await enviarMensagemTelegram(msg);
      }

      count += 1;

      if (count === 10) {
        count = 0;
      }
    }


    if (debug) { console.log("10 - Iniciando logs") }

    // ================================
    // LOG — CEX (Compra)
    // ================================
    console.log(`\n💰 [${result.timestamp}] BitSpot - Cotação com banca de ${amountBRL}`);
    console.log(`${result.exchange} -> ${result.dexName} | Lucro: R$ ${result.profit} (${result.percent}%)`);

    console.log('\n📥 CEX — Compra (ordenadas pelo melhor preço)');
    [...validCex]
      .sort((a, b) => a.price - b.price)
      .forEach(c => {
        const usdt = (amountBRL / c.price).toFixed(2);
        console.log(
          `  • ${c.name.padEnd(8)} | Preço: R$ ${c.price.toFixed(4)} | Recebe: ${usdt} USDT`
        );
      });

    console.log(`👉 Melhor compra: ${bestCex.name}\n`);

    // ================================
    // LOG — DEX (Venda)
    // ================================
    console.log('📤 DEX — Venda (ordenadas pelo maior retorno)');
    [...validDex]
      .sort((a, b) => b.value - a.value)
      .forEach(d => {
        console.log(
          `  • ${d.name.padEnd(10)} | Retorno: R$ ${d.value.toFixed(2)} | ` +
          `Lucro: R$ ${d.profit.toFixed(2)} (${d.percent.toFixed(2)}%)`
        );
      });

    console.log(`👉 Melhor venda: ${bestDex.name}\n`);

    // validação com oracle para futuros filtros
    console.log("🔍 Validação Oracle (preço unitário)");

    const chainlinkPrice = await getUsdBrlPrice();
    const expectedBRL = amountUSDT * chainlinkPrice;

    validDex.forEach(d => {
      const unitPrice = d.value / amountUSDT;
      const deviation =
        ((unitPrice - chainlinkPrice) / chainlinkPrice) * 100;

      console.log(
        `  • ${d.name.padEnd(10)} | ` +
        `DEX: R$ ${unitPrice.toFixed(4)} | ` +
        `Oracle: R$ ${chainlinkPrice.toFixed(4)} | ` +
        `Desvio: ${deviation.toFixed(2)}%`
      );
    });

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
