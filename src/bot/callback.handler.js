
require('dotenv').config();
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const { getLastCycleMessage, getBestLastHourMessage, getLast24hSummaryMessage} = require("../services/historyService");

async function hist_cicloHandler(ctx) {
    await ctx.reply("Gerando relatório");
    const msg = await getLastCycleMessage();
    await ctx.reply(msg);
}

async function hist_last1hrHandler(ctx) {
    await ctx.reply("Gerando relatório");
    const msg = await getBestLastHourMessage();
    await ctx.reply(msg);
}

async function  hist_last24hrHandler(ctx) {
    await ctx.reply("Gerando relatório");
    const msg = await getLast24hSummaryMessage();
    await ctx.reply(msg);
}

module.exports = {
    hist_cicloHandler,
    hist_last1hrHandler,
    hist_last24hrHandler
}




