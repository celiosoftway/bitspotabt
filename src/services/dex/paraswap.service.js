require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const { toBaseUnit } = require("../../utils/token.utils");

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const CHAIN_ID = 137; // Polygon

const ERC20ABI = [
  "function approve(address spender, uint amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint)"
];

async function approveIfNeeded(tokenAddress, amount, spender) {

  const token = new ethers.Contract(tokenAddress, ERC20ABI, wallet);

  const allowance = await token.allowance(wallet.address, spender);

  if (BigInt(allowance) < BigInt(amount)) {

    const tx = await token.approve(spender, amount);
    await tx.wait();
  }
}

async function quote({ tokenIn, tokenOut, amountIn, decimalsIn }) {

  const amountBase = toBaseUnit(amountIn, decimalsIn);

  const url =
    `https://api.paraswap.io/prices`
    + `?srcToken=${tokenIn}`
    + `&destToken=${tokenOut}`
    + `&srcDecimals=${decimalsIn}`
    + `&destDecimals=18`
    + `&amount=${amountBase}`
    + `&side=SELL`
    + `&network=${CHAIN_ID}`
    + `&userAddress=${wallet.address}`
    + `&version=6.2`;

  const { data } = await axios.get(url);

  if (!data?.priceRoute) {
    throw new Error("Falha ao obter cotação ParaSwap");
  }

  return data.priceRoute;
}

async function swap({ tokenIn, tokenOut, amountIn, decimalsIn, slippage }) {

  const amountBase = toBaseUnit(amountIn, decimalsIn);

  const priceRoute = await quote({
    tokenIn,
    tokenOut,
    amountIn,
    decimalsIn
  });

  const txBody = {
    srcToken: tokenIn,
    destToken: tokenOut,
    srcAmount: amountBase,
    userAddress: wallet.address,
    partner: "paraswap.io",
    slippage: slippage,
    priceRoute,
    deadline: Math.floor(Date.now() / 1000) + 1800
  };

  const { data } = await axios.post(
    `https://api.paraswap.io/transactions/${CHAIN_ID}`,
    txBody
  );

  if (!data?.to || !data?.data) {
    throw new Error("Falha ao montar transação ParaSwap");
  }

  await approveIfNeeded(tokenIn, amountBase, data.to);

  const tx = await wallet.sendTransaction({
    to: data.to,
    data: data.data,
    value: data.value ? BigInt(data.value) : 0n,
    gasLimit: 1_000_000n
  });

  const receipt = await tx.wait();

  return {
    hash: receipt.hash,
    dex: "ParaSwap"
  };
}

module.exports = {
  quote,
  swap
};