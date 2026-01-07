const { Op } = require("sequelize");
const Snapshot = require("../models/Snapshot");

function calculateOperableMinutes(snapshots, minProfit, intervalMinutes = 1) {
  let inWindow = false;
  let totalMinutes = 0;

  for (const s of snapshots) {
    if (s.profit >= minProfit) {
      inWindow = true;
      totalMinutes += intervalMinutes;
    } else {
      inWindow = false;
    }
  }

  return totalMinutes;
}

async function calculateOperabilityByPeriod({
  hours,
  minProfit
}) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const snapshots = await Snapshot.findAll({
    where: {
      createdAt: { [Op.gte]: since }
    },
    order: [["createdAt", "ASC"]]
  });

  if (!snapshots.length) return null;

  const byStrategy = {
    100: [],
    75: [],
    50: []
  };

  for (const s of snapshots) {
    if (byStrategy[s.strategy]) {
      byStrategy[s.strategy].push(s);
    }
  }

  const result = {};

  for (const strategy of [100, 75, 50]) {
    result[strategy] = calculateOperableMinutes(
      byStrategy[strategy],
      minProfit
    );
  }

  return result;
}

async function getOperabilityReportMessage({
  label,
  hours,
  minProfit
}) {
  const data = await calculateOperabilityByPeriod({
    hours,
    minProfit
  });

  if (!data) {
    return `📉 *Operabilidade — ${label}*\n\nNenhum dado disponível.`;
  }

  let msg = `📊 *Operabilidade — ${label}*\n`;
  msg += `📌 Lucro mínimo considerado: R$ ${minProfit}\n\n`;

  for (const strategy of [100, 75, 50]) {
    const minutes = data[strategy];

    msg +=
      `💼 *${strategy}%*\n` +
      `• Tempo no range: ${minutes} min\n\n`;
  }

  return msg.trim();
}

async function get24hOperabilityMessage(minProfit) {
  return getOperabilityReportMessage({
    label: "Últimas 24h",
    hours: 24,
    minProfit
  });
}

async function get7dOperabilityMessage(minProfit) {
  return getOperabilityReportMessage({
    label: "Últimos 7 dias",
    hours: 24 * 7,
    minProfit
  });
}

async function get30dOperabilityMessage(minProfit) {
  return getOperabilityReportMessage({
    label: "Últimos 30 dias",
    hours: 24 * 30,
    minProfit
  });
}

module.exports = {
  get24hOperabilityMessage,
  get7dOperabilityMessage,
  get30dOperabilityMessage
};
