require('dotenv').config();
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const { getConfig, setConfig } = require('../services/configService');
const { runMonitor } = require('../core/monitor');

const { enviarMensagemTelegram } = require('../utils/util');
const { getLastCycleMessage, getBestLastHourMessage, getLast24hSummaryMessage } = require("../services/historyService");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = parseInt(process.env.OWNER_ID);

const defineBancaScene = require("./defineBanca");
const stage = new Scenes.Stage([
  defineBancaScene,
]);

bot.use(session());
bot.use(stage.middleware());

// Middleware de Autenticação
bot.use(async (ctx, next) => {
  if (ctx.from?.id !== OWNER_ID) {
    return ctx.reply("🚫 Acesso negado.");
  }
  return next();
});

bot.start((ctx) => {
  ctx.reply('🤖 BitSpot Bot Ativo!', Markup.keyboard([
    ['📊 Cotação', '💰 Saldo'],
    ['⚙️ Configurações', '💸 Banca'],
    ['📈 Histórico']
  ]).resize());
});

bot.hears('📊 Cotação', async (ctx) => {
  ctx.reply(`⏳ Realizando cotação...`);

  const result = await runMonitor("bot");

  if (!result) {
    ctx.reply('❌ Nenhum dado retornado');
    return;
  }

  let mensagem = `📅 ${result.timestamp} Banca ${result.amountBRL} BRL\n\n`;
  mensagem += `💰 Lucro bruto (BRL): ${result.profit}\n`;
  mensagem += `📊 Lucro percentual (%): ${result.percent}\n\n`;
  mensagem += `🟢 Compre ${result.amountUSDT} USDT na ${result.exchange}\n`;
  mensagem += `🔁 Venda na ${result.dexName} por ${result.dexPrice.toFixed(4)}\n`;

  ctx.reply(mensagem);
});

bot.hears('⚙️ Configurações', async (ctx) => {
  const banca = await getConfig('banca');
  const msg = `⚙️ *Configurações Atuais*\n\n` +
    `💵 Banca: R$ ${banca.amountBRL}\n` +
    `🎯 Lucro Mínimo: R$ ${banca.minProfit}\n` +
    `📊 Percentual Mínimo: ${banca.minPercent}%`;

  ctx.reply(msg, { parse_mode: 'Markdown' });
});

// define as configurações de banca
bot.hears("💸 Banca", (ctx) => ctx.scene.enter("defineBancaScene"));
bot.action("defineBancaAction", (ctx) => ctx.scene.enter("defineBancaScene"));

// exibe saldo da carteira e da exchange
bot.hears('💰 Saldo', async (ctx) => {
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
});

//historico
bot.hears("📈 Histórico", async (ctx) => {
    return ctx.reply("⚙️ Escolha a opção desejada:", Markup.inlineKeyboard([
        [Markup.button.callback("Ultimo ciclo", "hist_ciclo")],
        [Markup.button.callback("Ultima hora", "hist_hora")],
        [Markup.button.callback("Ultimas 24 horas", "hist_24horas")],
    ]));
});

// bot.action é a ação executada pelo bot.hears
bot.action("hist_ciclo", async (ctx) => {
  await ctx.reply("Gerando relatório");
  
  const msg = await getLastCycleMessage();
  await ctx.reply(msg);
});

bot.action("hist_24horas", async (ctx) => {
  await ctx.reply("Gerando relatório");
  
  const msg = await getBestLastHourMessage();
  await ctx.reply(msg);
});

bot.action("hist_ciclo", async (ctx) => {
  await ctx.reply("Gerando relatório");
  
  const msg = await getLast24hSummaryMessage();
  await ctx.reply(msg);
});


// tratar erros
bot.catch(async (err, ctx) => {
  console.error("❌ Erro global capturado:");
  console.error("Chat ID:", ctx?.chat?.id);
  console.error("Update:", ctx?.update);

  await enviarMensagemTelegram("🤖 Bot caiu...");
  console.error(err);
});


async function startBot() {
  /*
  inserir autenticação quando trocar para mysql
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao banco de dados SQLite.");
    await sequelize.sync({ alter: true });

  } catch (error) {
    console.error("Erro geral:", error);
  }
  */

  bot.launch({ dropPendingUpdates: true });
  console.log("🤖 Iniciado...");
  await enviarMensagemTelegram("🤖 Iniciado...");
}

module.exports = { startBot };
