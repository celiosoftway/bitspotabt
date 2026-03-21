const { getBalance, buyMarket, withdraw, getWithdrawStatus } = require("./services/cex/binance.service");

async function test() {
    const usdt = await getBalance("USDT");
    console.log("Saldo USDT:", usdt);

    const brl = await getBalance("BRL");
    console.log("Saldo BRL:", brl);

    return { usdt, brl };
}

(async () => {
    try {
        const { usdt, brl } = await test();

        //compra de USDT usando BRL
        // await buyMarket({ symbol: "USDTBRL", quoteAmount: 100 });

        /*
        const withdrawResult = await withdraw({
            asset: "USDT",
            network: "MATIC",
            amount: usdt,
            address: "0x53f5B2862deC8dE43d2635Ef6d8D899FD8807710",
        });

        console.log("Resultado do saque:", withdrawResult);
        */

        const withdrawStatus = await getWithdrawStatus("406d1511bb0e4e1fb0696d16ca9379df");
        console.log("Status do saque:", withdrawStatus);

    } catch (error) {
        console.error("Erro:", error.response ? error.response.data : error.message);
    }
})();

// node src/cex.js