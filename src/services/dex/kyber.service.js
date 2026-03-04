require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const { toBaseUnit } = require("../../utils/token.utils");

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const AggregatorDomain = "https://aggregator-api.kyberswap.com";

const ChainName = {
  1: "ethereum",
  56: "bsc",
  137: "polygon",
  42161: "arbitrum",
  10: "optimism",
  43114: "avalanche",
};

const CHAIN_ID = 137; // Polygon
const CHAIN_NAME = ChainName[CHAIN_ID];

const ERC20ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

async function approveIfNeeded(tokenAddress, spender, amount) {

  const token = new ethers.Contract(tokenAddress, ERC20ABI, wallet);
  const allowance = await token.allowance(wallet.address, spender);

  if (BigInt(allowance) < BigInt(amount)) {

    const tx = await token.approve(spender, amount);
    await tx.wait();
  }
}

async function quote({ tokenIn, tokenOut, amountIn, decimalsIn }) {

  const amountBase = toBaseUnit(amountIn, decimalsIn);

  const url = `${AggregatorDomain}/${CHAIN_NAME}/api/v1/routes`;

  const { data } = await axios.get(url, {
    params: {
      tokenIn,
      tokenOut,
      amountIn: amountBase
    }
  });

  if (!data?.data?.routeSummary) {
    throw new Error("Falha ao obter rota Kyber");
  }

  return data.data;
}

async function swap({ tokenIn, tokenOut, amountIn, decimalsIn, slippage }) {

  const routeData = await quote({
    tokenIn,
    tokenOut,
    amountIn,
    decimalsIn
  });

  const routeSummary = routeData.routeSummary;

  const buildUrl = `${AggregatorDomain}/${CHAIN_NAME}/api/v1/route/build`;

  const { data } = await axios.post(buildUrl, {
    routeSummary,
    sender: wallet.address,
    recipient: wallet.address,
    slippageTolerance: slippage
  });

  if (!data?.data?.data) {
    throw new Error("Falha ao montar transação Kyber");
  }

  const encodedSwapData = data.data.data;
  const routerAddress = data.data.routerAddress;

  const amountBase = toBaseUnit(amountIn, decimalsIn);

  await approveIfNeeded(tokenIn, routerAddress, amountBase);

  const tx = await wallet.sendTransaction({
    to: routerAddress,
    data: encodedSwapData,
    value: 0
  });

  const receipt = await tx.wait();

  return {
    hash: receipt.hash,
    dex: "KyberSwap"
  };
}

module.exports = {
  quote,
  swap
};