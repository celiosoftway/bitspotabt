require('dotenv').config();
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const { enviarMensagemTelegram } = require('../utils/util');

const {
  metricsHandler,
  cotacaoHandler,
  saldoHandler,
  configHandler,
  historicoHandler
} = require('./handlers');

const {
  hist_cicloHandler,
  hist_last1hrHandler,
  hist_last24hrHandler
} = require('./callback.handler');

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
    ['🔍 Cotação', '💰 Saldo'],
    ['⚙️ Configurações', '💸 Config. Banca'],
    ['📈 Histórico', '📊 ROI']
  ]).resize());
});

// comandos hears do keyboard
bot.hears('🔍 Cotação', cotacaoHandler);
bot.hears('📊 ROI', metricsHandler);
bot.hears('💰 Saldo', saldoHandler);
bot.hears('⚙️ Configurações', configHandler);
bot.hears("💸 Config. Banca", (ctx) => ctx.scene.enter("defineBancaScene"));
bot.hears("📈 Histórico", historicoHandler);

// bot.action 
bot.action("defineBancaAction", (ctx) => ctx.scene.enter("defineBancaScene"));
bot.action("hist_ciclo", hist_cicloHandler);
bot.action("hist_1hora", hist_last1hrHandler);
bot.action("hist_24horas", hist_last24hrHandler);

// tratar erros
bot.catch(async (err, ctx) => {
  console.error("❌ Erro global capturado:");
  console.error("Chat ID:", ctx?.chat?.id);
  console.error("Update:", ctx?.update);

  await enviarMensagemTelegram("🤖 Bot caiu...");
  console.error(err);
});

// iniciar o bot
async function startBot() {
  bot.launch({ dropPendingUpdates: true });
  console.log("🤖 Iniciado...");
  await enviarMensagemTelegram("🤖 Iniciado...");
}

module.exports = { startBot };
