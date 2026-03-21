
/*
    MonitorV2 - Evolução do monitor para incluir o processo completo de compra na CEX, saque, e venda na DEX  
    simula um delay de 10 minutos para o saque, e valida o lucro após o saque para só então executar a venda na DEX
     - checkEntryOpportunity: busca oportunidade de arbitragem e cria ordem com status "WITHDRAW_PENDING"
     - checkWithdrawCompletion: simula o recebimento do saque após 10 minutos, atualiza a ordem para "WAITING_DEX"
     - checkExitOpportunity: busca oportunidade de venda na DEX, se lucro for positivo, executa a venda e atualiza a ordem para "EXECUTED"  
*/

const { getConfig } = require('../services/configService');
const priceService = require('../services/priceService');
const { enviarMensagemTelegram } = require('../utils/util');
const Order = require('../models/Order');

const { getUsdBrlPrice } = require('../services/oracleService');

require('dotenv').config();
const WITHDRAW_DELAY_MIN = 1;
const CHECK_INTERVAL = 60000;
let activeOrder = null;
let bestquotes;
const MAX_ORACLE_DEVIATION = 0.6; // %

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function getBestCexPrice(exchangesConfig) {

    const prices = [];

    if (exchangesConfig.Binance)
        prices.push({ name: 'Binance', price: await priceService.getBinancePrice() });

    if (exchangesConfig.Mexc)
        prices.push({ name: 'Mexc', price: await priceService.getMexcPrice() });

    if (exchangesConfig.Bitget)
        prices.push({ name: 'Bitget', price: await priceService.getBitgetPrice() });

    const valid = prices.filter(p => p.price);
    if (!valid.length) return null;

    return valid.reduce((a, b) => a.price < b.price ? a : b);
}

async function getBestDexQuote(amountUSDT) {

    const oraclePrice = await getUsdBrlPrice();
    bestquotes = `\nOracle price: ${oraclePrice.toFixed(4)} BRL\n`;

    const quotesRaw = await Promise.all([
        priceService.getParaSwapQuote(amountUSDT),
        priceService.getKyberQuote(amountUSDT),
        priceService.getOdosQuote(amountUSDT)
    ]);

    const quotes = [
        { name: 'ParaSwap', value: quotesRaw[0] },
        { name: 'Kyber', value: quotesRaw[1] },
        { name: 'Odos', value: quotesRaw[2] }
    ].filter(q => q.value);

    if (!quotes.length) return null;

    const validQuotes = [];

    for (const q of quotes) {

        const dexUnitPrice = q.value / amountUSDT;

        bestquotes += `${q.name} quote: ${dexUnitPrice.toFixed(4)} BRL\n`;

        const deviation =
            ((dexUnitPrice - oraclePrice) / oraclePrice) * 100;

        if (Math.abs(deviation) > MAX_ORACLE_DEVIATION) {

            log(`DEX descartada ${q.name} | dev ${deviation.toFixed(2)}%`);
            continue;
        }

        validQuotes.push(q);
    }

    if (!validQuotes.length) {

        log("Todas DEX descartadas pelo oracle");
        return null;
    }

    return validQuotes.reduce((a, b) =>
        a.value > b.value ? a : b
    );
}

/*
async function getBestDexQuote(amountUSDT) {

    const quotesRaw = await Promise.all([
        priceService.getParaSwapQuote(amountUSDT),
        priceService.getKyberQuote(amountUSDT),
        priceService.getOdosQuote(amountUSDT)
    ]);

    const quotes = [
        { name: 'ParaSwap', value: quotesRaw[0] },
        { name: 'Kyber', value: quotesRaw[1] },
        { name: 'Odos', value: quotesRaw[2] }
    ];

    const valid = quotes.filter(q => q.value);
    if (!valid.length) return null;

    return valid.reduce((a, b) => a.value > b.value ? a : b);
}

*/

async function checkEntryOpportunity() {

    const exchangesConfig = await getConfig('exchanges');
    const banca = await getConfig('banca');

    const { amountBRL, minProfit } = banca;
   // console.log("minProfit", minProfit);

    const bestCex = await getBestCexPrice(exchangesConfig);
    if (!bestCex) return;

    const amountUSDT = amountBRL / bestCex.price;

    const bestDex = await getBestDexQuote(amountUSDT);
    // if (!bestDex) return;

    const profit = bestDex.value - amountBRL;
    // if (profit < minProfit) return;

    bestquotes += `CEX: ${bestCex.name} | price: ${bestCex.price.toFixed(4)} BRL\n`;
    bestquotes += `Total obtido: ${bestDex.name} | price: ${bestDex.value.toFixed(4)} BRL\n`;
    bestquotes += `Lucro: ${profit.toFixed(2)} BRL\n`;
    console.log(bestquotes);

    if (!bestDex) return;
    if (profit < minProfit) return;

    log(`🚀 OPORTUNIDADE DETECTADA`);

    const percent = ((profit / amountBRL) * 100).toFixed(2);
    const timestamp = new Date().toISOString();

    const opportunityMsg =
        `🚀 *Oportunidade Detectada!*\n\n` +
        `🏦 Banca: R$ ${amountBRL}\n` +
        `💰 Lucro Estimado: R$ ${profit.toFixed(2)} (${percent}%)\n\n` +
        `📥 *Compra CEX*\n` +
        `${amountUSDT.toFixed(2)} USDT na ${bestCex.name}\n` +
        `Unit: R$ ${bestCex.price.toFixed(4)}\n\n` +
        `📤 *Venda DEX*\n` +
        `${bestDex.name}\n` +
        `Unit: R$ ${(bestDex.value / amountUSDT).toFixed(4)}\n` +
        `Total: R$ ${bestDex.value.toFixed(2)}\n\n` +
        `🕒 ${timestamp}`;

    await enviarMensagemTelegram(opportunityMsg);

    // EVOLUÇÃO EM PRODUÇÃO: FUNÇÃO REAL DE TRADE E SAQUE
    // VALIDAR E CRIAR ORDER COM OS DADOS REAIS DE amountUSDT

    log(`Ordem aberta`);
    log(`Compra CEX: ${amountUSDT.toFixed(2)} USDT`);
    log(`Aguardando saque 10 minutos`);

    const order = await Order.create({

        status: "WITHDRAW_PENDING",

        amountBRL,
        amountUSDT,

        cexName: bestCex.name,
        cexPrice: bestCex.price,

        dexNameOpen: bestDex.name,
        dexQuoteOpen: bestDex.value,

        usdtReceived: amountUSDT - 1,

        withdrawETA: new Date(Date.now() + WITHDRAW_DELAY_MIN * 60 * 1000),

        profitExpected: profit,

        openedAt: new Date()

    });

    activeOrder = order;

    const orderMsg =
        `📊 *Ordem Aberta*\n\n` +
        `💳 Compra executada na CEX\n` +
        `Exchange: ${bestCex.name}\n` +
        `USDT comprado: ${amountUSDT.toFixed(2)}\n\n` +
        `💸 Taxas simuladas: 1 USDT\n` +
        `USDT líquido: ${(amountUSDT - 1).toFixed(2)}\n\n` +
        `⏳ Saque iniciado\n` +
        `Tempo estimado: ${WITHDRAW_DELAY_MIN} minutos\n\n` +
        `🔄 Aguardando chegada na carteira para buscar swap`;

    await enviarMensagemTelegram(orderMsg);
}

async function checkWithdrawCompletion() {

    // EVOLUÇÃO EM PRODUÇÃO: VALIDAR O SAQUE VERIFIANDO O SALDO EM usdt NA CARTEIRA
    // COM O SALDO EM CARTEIRA POPULA withdrawETA E usdtReceived 

    if (!activeOrder) return;
    if (activeOrder.status !== "WITHDRAW_PENDING") return;
    if (Date.now() < new Date(activeOrder.withdrawETA).getTime()) return;

    activeOrder.status = "WAITING_DEX";
    activeOrder.withdrawCompletedAt = new Date();

    await activeOrder.save();

    log(`💰 Transferência recebida`);
    log(`USDT disponível: ${activeOrder.usdtReceived.toFixed(2)}`);
    log(`Procurando oportunidade de swap\n`);

    await enviarMensagemTelegram(
        `💰 Transferência recebida\nUSDT disponível: ${activeOrder.usdtReceived.toFixed(2)}\nProcurando oportunidade de swap`
    );
}

async function checkExitOpportunity() {

    if (!activeOrder) return;
    if (activeOrder.status !== "WAITING_DEX") return;

    const bestDex = await getBestDexQuote(activeOrder.usdtReceived);
    if (!bestDex) return;

    const profit = bestDex.value - activeOrder.amountBRL;

    if (profit <= 0) {
        log(`Aguardando oportunidade... lucro atual ${profit.toFixed(2)}`);
        return;
    }

    // EVOLUÇÃO EM PRODUÇÃO: CRIAR FUNÇÃO DE EXECUÇÃO E VALIDAÇÃO DO SWAP

    activeOrder.status = "EXECUTED";
    activeOrder.executedAt = new Date();

    activeOrder.dexNameExecute = bestDex.name;
    activeOrder.dexQuoteExecute = bestDex.value;
    activeOrder.profitReal = profit;

    await activeOrder.save();

    log(`🔥 ORDEM EXECUTADA`);
    log(`DEX: ${bestDex.name}`);
    log(`Valor final: ${bestDex.value.toFixed(2)}`);
    log(`Lucro: ${profit.toFixed(2)}`);

    await enviarMensagemTelegram(
        `🔥 Ordem executada\nDEX: ${bestDex.name}\nLucro: R$ ${profit.toFixed(2)}`
    );

    activeOrder = null;
}

async function restoreActiveOrder() {

    const order = await Order.findOne({
        where: {
            status: ['WITHDRAW_PENDING', 'WAITING_DEX']
        },
        order: [['openedAt', 'DESC']]
    });

    if (!order) {
        log("Nenhuma ordem ativa encontrada no banco");
        return;
    }

    activeOrder = order;

    log(`Ordem restaurada do banco`);
    log(`Status: ${order.status}`);
    log(`USDT: ${order.usdtReceived}`);
}

async function runMonitor() {
    // EVOLUÇÃO EM PRODUÇÃO: ADICIONAR UMA NOVA FUNÇÃO PARA VERIFICAR O SALDO NAS EXCHANGES HABILITADAS

    try {

        if (!activeOrder) {

            await checkEntryOpportunity();

        } else {

            await checkWithdrawCompletion();
            await checkExitOpportunity();

        }

    } catch (err) {

        console.error("Erro monitor:", err.message);

    }
}

let interval = null;

async function startMonitoring() {

    if (interval) return;

    log("Monitor iniciado");

    // restaura ordem ativa
    await restoreActiveOrder();

    runMonitor();

    interval = setInterval(runMonitor, CHECK_INTERVAL);
}

function stopMonitoring() {

    if (!interval) return;

    clearInterval(interval);
    interval = null;

    log("Monitor parado");
}

module.exports = {
    startMonitoring,
    stopMonitoring
};