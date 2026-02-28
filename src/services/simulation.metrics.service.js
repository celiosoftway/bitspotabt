const { Op } = require('sequelize');
const TradeSimulation = require('../models/TradeSimulation');

function getStartDate(period) {

  const now = new Date();

  switch (period) {

    case 'today':
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      return startToday;

    case '24h':
      return new Date(now.getTime() - (24 * 60 * 60 * 1000));

    case '7d':
      return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    case '30d':
      return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    default:
      throw new Error('Período inválido');
  }
}

async function getConsolidatedMetrics(period) {

  const startDate = getStartDate(period);

  // Trades dentro do período
  const trades = await TradeSimulation.findAll({
    where: {
      createdAt: {
        [Op.gte]: startDate
      }
    },
    order: [['createdAt', 'ASC']]
  });

  // Se não houver trades no período
  if (!trades.length) {

    // buscar último saldo global
    const lastTradeEver = await TradeSimulation.findOne({
      order: [['createdAt', 'DESC']]
    });

    const saldo = lastTradeEver
      ? parseFloat(lastTradeEver.saldo_apos_trade)
      : 0;

    return {
      operations: 0,
      lucroLiquido: 0,
      saldoInicial: saldo,
      saldoFinal: saldo,
      roiPercent: 0
    };
  }

  // ================================
  // Número de operações
  // ================================
  const operations = trades.length;

  // ================================
  // Lucro líquido total
  // ================================
  const lucroLiquido = trades.reduce((acc, t) => {
    return acc + parseFloat(t.lucro_liquido);
  }, 0);

  // ================================
  // Saldo final = último trade do período
  // ================================
  const saldoFinal = parseFloat(
    trades[trades.length - 1].saldo_apos_trade
  );

  // ================================
  // Saldo inicial do período
  // ================================
  const previousTrade = await TradeSimulation.findOne({
    where: {
      createdAt: {
        [Op.lt]: startDate
      }
    },
    order: [['createdAt', 'DESC']]
  });

  let saldoInicial;

  if (previousTrade) {
    saldoInicial = parseFloat(previousTrade.saldo_apos_trade);
  } else {
    // Não existe trade antes do período
    // Buscar o primeiro trade histórico
    const firstTradeEver = await TradeSimulation.findOne({
      order: [['createdAt', 'ASC']]
    });

    if (!firstTradeEver) {
      // tabela completamente vazia
      return {
        operations: 0,
        lucroLiquido: 0,
        saldoInicial: 0,
        saldoFinal: 0,
        roiPercent: 0
      };
    }

    saldoInicial =
      parseFloat(firstTradeEver.saldo_apos_trade) -
      parseFloat(firstTradeEver.lucro_liquido);
  }

  // ================================
  // ROI do período
  // ================================
  const roiPercent = saldoInicial > 0
    ? ((saldoFinal - saldoInicial) / saldoInicial) * 100
    : 0;

  return {
    operations,
    lucroLiquido: parseFloat(lucroLiquido.toFixed(2)),
    saldoInicial: parseFloat(saldoInicial.toFixed(2)),
    saldoFinal: parseFloat(saldoFinal.toFixed(2)),
    roiPercent: parseFloat(roiPercent.toFixed(2))
  };
}

module.exports = {
  getConsolidatedMetrics
};