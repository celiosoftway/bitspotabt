const metricsService = require('../services/simulation.metrics.service');
const { runMonitor } = require('../core/monitor');

async function metricsHandler(ctx) {

    const metricsToday = await metricsService.getConsolidatedMetrics('today');
    const metrics24h = await metricsService.getConsolidatedMetrics('24h');
    const metrics7d = await metricsService.getConsolidatedMetrics('7d');
    const metrics30d = await metricsService.getConsolidatedMetrics('30d');

    let msg = `Resultados das operações do 🤖 BitSpot Cex/Dex\n\n`
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

module.exports = {
    metricsHandler,
    cotacaoHandler
};