const odos = require("./odos.service");
const kyber = require("./kyber.service");
const paraswap = require("./paraswap.service");

async function swap(dexName, params) {

  switch (dexName) {
    case "Odos":
      return odos.swap(params);

    case "KyberSwap":
      return kyber.swap(params);

    case "ParaSwap":
      return paraswap.swap(params);

    default:
      throw new Error("DEX não suportada");
  }
}

module.exports = {
  swap
};


/*
await dexRouter.swap(result.dexName, {
  tokenIn: process.env.USDT,
  tokenOut: process.env.BRL,
  amountIn: result.amountUSDT,
  decimalsIn: 6,
  slippage: 0.5
});
*/