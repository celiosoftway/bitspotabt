const axios = require('axios');

const USDT_POLYGON = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';
const BRLA_POLYGON = '0xe6a537a407488807f0bbeb0038b79004f19dddfb';

async function getBinancePrice() {
  try {
    const res = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
    return parseFloat(res.data.price);
  } catch (err) {
    return null;
  }
}

async function getMexcPrice() {
  try {
    const res = await axios.get('https://api.mexc.com/api/v3/ticker/price?symbol=BRLUSDT');
    return 1 / parseFloat(res.data.price);
  } catch (err) {
    return null;
  }
}

async function getBitgetPrice() {
  try {
    const res = await axios.get('https://api.bitget.com/api/spot/v1/market/ticker?symbol=usdtbrl_spbl');
    return parseFloat(res.data.data.close);
  } catch (err) {
    return null;
  }
}

async function getParaSwapQuote(amountUSDT) {
  try {
    const amountInWei = (amountUSDT * 1e6).toFixed(0);
    const url = `https://api.paraswap.io/prices?srcToken=${USDT_POLYGON}&destToken=${BRLA_POLYGON}&amount=${amountInWei}&srcDecimals=6&destDecimals=18&network=137`;
    const res = await axios.get(url);
    return parseFloat(res.data.priceRoute.destAmount) / 1e18;
  } catch (err) {
    return null;
  }
}

async function getKyberQuote(amountUSDT) {
  try {
    const amountInWei = (amountUSDT * 1e6).toFixed(0);
    const url = `https://aggregator-api.kyberswap.com/polygon/api/v1/routes?tokenIn=${USDT_POLYGON}&tokenOut=${BRLA_POLYGON}&amountIn=${amountInWei}&saveGas=false&gasInclude=false`;
    const res = await axios.get(url);
    return parseFloat(res.data.data.routeSummary.amountOut) / 1e18;
  } catch (err) {
    return null;
  }
}

async function getOdosQuote(amountUSDT) {
  try {
    const url = 'https://api.odos.xyz/sor/quote/v2';
    const body = {
      chainId: 137,
      inputTokens: [{ tokenAddress: USDT_POLYGON, amount: String((amountUSDT * 1e6).toFixed(0)) }],
      outputTokens: [{ tokenAddress: BRLA_POLYGON }],
      slippageLimitPercent: 1,
      userAddr: '0x0000000000000000000000000000000000000001'
    };
    const res = await axios.post(url, body);
    return parseFloat(res.data.outAmounts[0]) / 1e18;
  } catch (err) {
    return null;
  }
}

module.exports = {
  getBinancePrice,
  getMexcPrice,
  getBitgetPrice,
  getParaSwapQuote,
  getKyberQuote,
  getOdosQuote
};
