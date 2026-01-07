
require('dotenv').config();
const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;

async function enviarMensagemTelegram(mensagem) {
    console.log("\n🔁 enviando alerta no Telegran");

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
        chat_id: OWNER_ID,
        text: mensagem,
        parse_mode: 'Markdown'
    });
}

async function checaSaldo(ex, coin) {
    if (ex == 'binance') {
        try {
            const saldo = await binance.saldo(coin);

            return saldo;
        } catch (err) {
            console.error('❌ Erro ao verificar saldo:', err.response?.data || err.message);
        }
    }

    if (ex === 'carteira') {
        try {
            let ctoken = USDT;
            if (coin === 'BRL') { ctoken = BRL; }

            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const token = new ethers.Contract(ctoken, ERC20_ABI, provider);

            const [raw, decimals, symbol] = await Promise.all([
                token.balanceOf(wallet),
                token.decimals(),
                token.symbol()
            ]);

            const saldo = ethers.formatUnits(raw, decimals);
            console.log(`💰 Saldo da carteira:\n${saldo} ${symbol}`);

            return saldo;
        } catch (err) {
            console.error(err);
            console.log("❌ Erro ao consultar saldo. Verifique sua carteira ou RPC.");
        }

    }
}

module.exports = {
    checaSaldo, // implementar
    enviarMensagemTelegram,
}