// services/historyService.js
const Snapshot = require("../models/Snapshot");
const { Op } = require("sequelize");

async function getLastCycleMessage() {
  const snapshots = await Snapshot.findAll({
    order: [["createdAt", "DESC"]],
    limit: 3
  });

  if (!snapshots || snapshots.length < 3) {
    return "❌ Histórico insuficiente para formar um ciclo completo.";
  }

  // ordena para exibir 100 → 75 → 50
  snapshots.sort((a, b) => b.strategy - a.strategy);

  let msg = "📊 *Último ciclo*\n\n";

  for (const s of snapshots) {
    msg +=
      `💼 *${s.strategy}%*\n` +
      `Lucro: R$ ${s.profit.toFixed(2)} (${s.percent.toFixed(2)}%)\n` +
      `CEX: ${s.exchange} → ${s.dexName}\n\n`;
  }

  return msg.trim();
}

async function getBestLastHourMessage() {
    const since = new Date(Date.now() - 60 * 60 * 1000);

    const snapshots = await Snapshot.findAll({
        where: {
            createdAt: { [Op.gte]: since }
        }
    });

    if (snapshots.length === 0) {
        return "⏱️ *Última hora*\n\nNenhuma oportunidade encontrada.";
    }

    const bestByStrategy = {};

    for (const s of snapshots) {
        if (
            !bestByStrategy[s.strategy] ||
            s.profit > bestByStrategy[s.strategy].profit
        ) {
            bestByStrategy[s.strategy] = s;
        }
    }

    let msg = "⏱️ *Melhor oportunidade (última hora)*\n\n";

    for (const strategy of [100, 75, 50]) {
        const s = bestByStrategy[strategy];
        if (!s) continue;

        msg +=
            `🏆 *${strategy}%*\n` +
            `Lucro: R$ ${s.profit.toFixed(2)} (${s.percent.toFixed(2)}%)\n` +
            `🕒 ${s.createdAt.toLocaleTimeString()}\n\n`;
    }

    return msg.trim();
}

async function getLast24hSummaryMessage(minProfit = 10) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const snapshots = await Snapshot.findAll({
        where: {
            createdAt: {  [Op.gte]: since }
        }
    });

    if (snapshots.length === 0) {
        return "📈 *Últimas 24h*\n\nNenhum dado disponível.";
    }

    const grouped = {};

    for (const s of snapshots) {
        if (!grouped[s.strategy]) {
            grouped[s.strategy] = {
                count: 0,
                max: 0,
                sum: 0
            };
        }

        if (s.profit >= minProfit) {
            grouped[s.strategy].count++;
            grouped[s.strategy].sum += s.profit;
            grouped[s.strategy].max = Math.max(
                grouped[s.strategy].max,
                s.profit
            );
        }
    }

    let msg = "📈 *Resumo últimas 24h*\n\n";

    for (const strategy of [100, 75, 50]) {
        const g = grouped[strategy];
        if (!g || g.count === 0) continue;

        msg +=
            `💼 *${strategy}%*\n` +
            `• Oportunidades: ${g.count}\n` +
            `• Lucro máx: R$ ${g.max.toFixed(2)}\n` +
            `• Média: R$ ${(g.sum / g.count).toFixed(2)}\n\n`;
    }

    return msg.trim();
}

module.exports = { getLastCycleMessage, getBestLastHourMessage, getLast24hSummaryMessage };
