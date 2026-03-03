require('dotenv').config();
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const metricsService = require('../services/simulation.metrics.service');
const { runMonitor } = require('../core/monitor');
const { getConfig } = require('../services/configService');

async function metricsHandler(ctx) {

    const metricsToday = await metricsService.getConsolidatedMetrics('today');
    const metrics24h = await metricsService.getConsolidatedMetrics('24h');
    const metrics7d = await metricsService.getConsolidatedMetrics('7d');
    const metrics30d = await metricsService.getConsolidatedMetrics('30d');

    let msg = `Resultados das operações 🤖 BitSpot\n\n`
    msg += `📊 Hoje\n`
    msg += `Operações: ${metricsToday.operations}\n`;
    msg += `Lucro Líquido: R$ ${metricsToday.lucroLiquido}\n`;
    // msg += `Saldo Inicial: R$ ${metricsToday.saldoInicial}\n`;
    // msg += `Saldo Final: R$ ${metricsToday.saldoFinal}\n`;
    msg += `ROI: ${metricsToday.roiPercent}%\n\n`;

    msg += `📊 Ultimas 24 horas\n`
    msg += `Operações: ${metrics24h.operations}\n`;
    msg += `Lucro Líquido: R$ ${metrics24h.lucroLiquido}\n`;
    // msg += `Saldo Final: R$ ${metrics24h.saldoFinal}\n`;
    msg += `ROI: ${metrics24h.roiPercent}%\n\n`;

    msg += `📊 Ultimos 7 dias\n`
    msg += `Operações: ${metrics7d.operations}\n`;
    msg += `Lucro Líquido: R$ ${metrics7d.lucroLiquido}\n`;
    // msg += `Saldo Final: R$ ${metrics7d.saldoFinal}\n`;
    msg += `ROI: ${metrics7d.roiPercent}%\n\n`;

    msg += `📊 Ultimos 30 dias\n`
    msg += `Operações: ${metrics30d.operations}\n`;
    msg += `Lucro Líquido: R$ ${metrics30d.lucroLiquido}\n`;
    // msg += `Saldo Final: R$ ${metrics30d.saldoFinal}\n`;
    msg += `ROI: ${metrics30d.roiPercent}%\n\n`;

    await ctx.reply(msg);
    console.log(msg);

}

async function cotacaoHandler(ctx) {
    ctx.reply(`⏳ Realizando cotação...`);

    const result = await runMonitor("bot");

    if (!result) {
        ctx.reply('❌ Nenhum dado retornado');
        return;
    }

    let mensagem = `📅 ${result.timestamp}\n\nBanca ${result.amountBRL} BRL\n\n`;
    mensagem += `💰 Lucro bruto (BRL): ${result.profit}\n`;
    mensagem += `📊 Lucro percentual (%): ${result.percent}\n\n`;
    mensagem += `🟢 Compre ${result.amountUSDT} USDT na ${result.exchange}\n`;
    mensagem += `🔁 Venda na ${result.dexName} por ${result.dexPrice.toFixed(4)}\n`;

    ctx.reply(mensagem);
}

async function saldoHandler(ctx) {
    const { getBalances } = require('../services/walletService');
    const balances = await getBalances();

    if (!balances) {
        return ctx.reply('❌ Carteira não configurada no .env');
    }

    const msg = `💰 *Saldos na Polygon*\n\n` +
        `👛 Endereço: \`${balances.address}\`\n` +
        `💵 USDT: ${balances.USDT}\n` +
        `🇧🇷 BRLA: ${balances.BRLA}\n` +
        `🟣 MATIC: ${balances.MATIC}`;

    ctx.reply(msg, { parse_mode: 'Markdown' });
}

async function configHandler(ctx) {
    const banca = await getConfig('banca');
    const msg = `⚙️ *Configurações Atuais*\n\n` +
        `💵 Banca: R$ ${banca.amountBRL}\n` +
        `🎯 Lucro Mínimo: R$ ${banca.minProfit}\n` +
        `📊 Percentual Mínimo: ${banca.minPercent}%`;

    ctx.reply(msg, { parse_mode: 'Markdown' });
}

async function historicoHandler(ctx) {
    return ctx.reply("⚙️ Escolha a opção desejada:", Markup.inlineKeyboard([
        [Markup.button.callback("Ultimo ciclo", "hist_ciclo")],
        [Markup.button.callback("Ultima hora", "hist_1hora")],
        [Markup.button.callback("Ultimas 24 horas", "hist_24horas")],
    ]));
}

module.exports = {
    metricsHandler,
    cotacaoHandler,
    saldoHandler,
    configHandler,
    historicoHandler
};