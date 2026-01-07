const priceService = require('./services/priceService');

async function test() {
  console.log('--- Testando CEX ---');
  console.log('Binance:', await priceService.getBinancePrice());
  console.log('Mexc:', await priceService.getMexcPrice());
  console.log('Bitget:', await priceService.getBitgetPrice());

  console.log('\n--- Testando DEX (100 USDT) ---');
  console.log('ParaSwap:', await priceService.getParaSwapQuote(100));
  console.log('KyberSwap:', await priceService.getKyberQuote(100));
  console.log('Odos:', await priceService.getOdosQuote(100));
}

test();
