const TradeSimulation = require('../models/TradeSimulation');

async function registerTrade(result, baseAmountBRL) {

  const fixedFee = parseFloat(process.env.SIMULATION_FIXED_FEE || "5");
  const slippagePercent = parseFloat(process.env.SIMULATION_SLIPPAGE_PERCENT || "0");

  const lucroBruto = result.profit;

  // aplica slippage
  const slippageValue = (lucroBruto * slippagePercent) / 100;

  const taxas = fixedFee;
  const lucroLiquido = lucroBruto - taxas - slippageValue;

  /*
  if (lucroLiquido <= 0) {
    console.log("📉 Trade ignorado (não cobre taxas/slippage).");
    return null;
  }
    */

  // busca último saldo salvo
  const lastTrade = await TradeSimulation.findOne({
    order: [['createdAt', 'DESC']]
  });

  let saldoAtual;

  if (!lastTrade) {
    saldoAtual = baseAmountBRL;
  } else {
    saldoAtual = parseFloat(lastTrade.saldo_apos_trade);
  }

  const novoSaldo = saldoAtual + lucroLiquido;

  const trade = await TradeSimulation.create({
    timestamp: new Date().toISOString(),
    banca_utilizada: result.amountBRL,
    dex: result.dexName,
    lucro_bruto: lucroBruto,
    taxas,
    lucro_liquido: lucroLiquido,
    saldo_apos_trade: novoSaldo,
    percent: result.percent
  });

  console.log(`📊 Simulação salva. Novo saldo: R$ ${novoSaldo.toFixed(2)}`);

  return trade;
}

module.exports = {
  registerTrade
};