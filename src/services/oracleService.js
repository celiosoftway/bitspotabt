// services/oracleService.js
const { ethers } = require("ethers");
require("dotenv").config();

/**
 * Chainlink BRL / USD Reference Price
 * Network: Polygon
 * Base: BRL
 * Quote: USD
 *
 * Feed retorna:
 *   1 BRL = X USD
 *
 * Para o bot precisamos:
 *   1 USD = X BRL
 */

const CHAINLINK_FEED = "0xB90DA3ff54C3ED09115abf6FbA0Ff4645586af2c";

const ABI = [
  "function latestRoundData() view returns (uint80 roundId,int256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)",
  "function decimals() view returns (uint8)"
];

// Provider direto no arquivo (Polygon)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL_POLYGON);

async function getUsdBrlPrice() {
  const feed = new ethers.Contract(CHAINLINK_FEED, ABI, provider);

  const roundData = await feed.latestRoundData();

  if (!roundData || roundData.answer == null || roundData.answer <= 0n) {
    throw new Error("Chainlink oracle retornou preço inválido");
  }

  const decimals = await feed.decimals();

  // 1 BRL = X USD
  const brlUsd = Number(
    ethers.formatUnits(roundData.answer, decimals)
  );

  if (!Number.isFinite(brlUsd) || brlUsd <= 0) {
    throw new Error("Preço BRL/USD inválido");
  }

  // Inverte → 1 USD = X BRL
  const usdBrl = 1 / brlUsd;

  return usdBrl;
}

module.exports = {
  getUsdBrlPrice
};
