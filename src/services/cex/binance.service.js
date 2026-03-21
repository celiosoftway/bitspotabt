process.env.DOTENV_CONFIG_SILENT = "true";
require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const BASE_URL = "https://api.binance.com";
const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;

function sign(query) {
  return crypto
    .createHmac("sha256", API_SECRET)
    .update(query)
    .digest("hex");
}

async function getServerTime() {
  const res = await axios.get(`${BASE_URL}/api/v3/time`);
  return res.data.serverTime;
}

async function getBalance(asset) {

  const timestamp = await getServerTime();
  const query = `timestamp=${timestamp}`;
  const signature = sign(query);

  const url = `${BASE_URL}/api/v3/account?${query}&signature=${signature}`;

  const res = await axios.get(url, {
    headers: { "X-MBX-APIKEY": API_KEY },
  });

  const balances = res.data.balances;
  const coin = balances.find(b => b.asset === asset);

  return coin ? parseFloat(coin.free) : 0;
}


async function buyMarket({ symbol, quoteAmount }) {

  const endpoint = `${BASE_URL}/api/v3/order`;
  const timestamp = await getServerTime();

  const params = new URLSearchParams({
    symbol,
    side: "BUY",
    type: "MARKET",
    quoteOrderQty: quoteAmount.toString(),
    timestamp: timestamp.toString(),
  });

  const signature = sign(params.toString());
  params.append("signature", signature);

  const response = await axios.post(endpoint, params, {
    headers: {
      "X-MBX-APIKEY": API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = response.data;

  return {
    orderId: data.orderId,
    executedQty: parseFloat(data.executedQty),
    cummulativeQuoteQty: parseFloat(data.cummulativeQuoteQty),
    status: data.status
  };
}

async function sellMarket({ symbol, baseAmount }) {

  const endpoint = `${BASE_URL}/api/v3/order`;
  const timestamp = await getServerTime();

  const params = new URLSearchParams({
    symbol,
    side: "SELL",
    type: "MARKET",
    quantity: baseAmount.toString(),
    timestamp: timestamp.toString(),
  });

  const signature = sign(params.toString());
  params.append("signature", signature);

  const response = await axios.post(endpoint, params, {
    headers: {
      "X-MBX-APIKEY": API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = response.data;

  return {
    orderId: data.orderId,
    executedQty: parseFloat(data.executedQty),
    cummulativeQuoteQty: parseFloat(data.cummulativeQuoteQty),
    status: data.status
  };
}

async function withdraw({ asset, network, amount, address }) {

  const timestamp = await getServerTime();

  const params = new URLSearchParams({
    coin: asset,
    network,
    address,
    amount: amount.toString(),
    timestamp: timestamp.toString(),
  });

  const signature = sign(params.toString());
  params.append("signature", signature);

  const res = await axios.post(
    `${BASE_URL}/sapi/v1/capital/withdraw/apply?${params}`,
    null,
    { headers: { "X-MBX-APIKEY": API_KEY } }
  );

  return res.data;
}

async function getWithdrawStatus(withdrawId) {
  const timestamp = await getServerTime();

  const params = new URLSearchParams({
    withdrawOrderId: withdrawId,
    timestamp: timestamp.toString(),
  });

  const signature = sign(params.toString());
  params.append("signature", signature);

  const res = await axios.get(
    `${BASE_URL}/sapi/v1/capital/withdraw/history?${params}`,
    {
      headers: { "X-MBX-APIKEY": API_KEY },
    }
  );

  return res.data;
}

module.exports = {
  getBalance,
  buyMarket,
  sellMarket,
  withdraw,
  getWithdrawStatus
};