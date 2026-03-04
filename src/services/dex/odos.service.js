require("dotenv").config();
const axios = require("axios");
const { ethers } = require("ethers");
const { toBaseUnit } = require("../../utils/token.utils");

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const ODOS_API = "https://api.odos.xyz/sor";
const CHAIN_ID = 137;

async function quote({ tokenIn, tokenOut, amountIn, decimalsIn, slippage }) {

  const amountUnits = toBaseUnit(amountIn, decimalsIn);

  const { data } = await axios.post(`${ODOS_API}/quote/v2`, {
    chainId: CHAIN_ID,
    inputTokens: [{ tokenAddress: tokenIn, amount: amountUnits }],
    outputTokens: [{ tokenAddress: tokenOut, proportion: 1 }],
    slippageLimitPercent: slippage,
    userAddr: wallet.address,
    disableRFQs: true,
    compact: true,
  });

  return data;
}

async function swap({ tokenIn, tokenOut, amountIn, decimalsIn, slippage }) {

  const quoteData = await quote({
    tokenIn,
    tokenOut,
    amountIn,
    decimalsIn,
    slippage
  });

  if (!quoteData?.pathId) {
    throw new Error("Falha ao obter rota Odos");
  }

  const assemble = await axios.post(`${ODOS_API}/assemble`, {
    userAddr: wallet.address,
    pathId: quoteData.pathId,
    simulate: false,
  });

  const { transaction } = assemble.data;

  const tx = await wallet.sendTransaction({
    to: transaction.to,
    data: transaction.data,
    value: ethers.toBigInt(transaction.value || "0"),
  });

  const receipt = await tx.wait();

  return {
    hash: receipt.hash,
    dex: "Odos"
  };
}

module.exports = {
  quote,
  swap
};