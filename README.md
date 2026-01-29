# 🤖 BitSpot - Arbitragem Spot Híbrida CEX/DEX

<img src="img/banner.png" align="middle">

Projeto refatorado para arbitragem entre corretoras centralizadas (CEX) e descentralizadas (DEX).

## 🛠️ Estrutura do Projeto

- `src/core/monitor.js`: Lógica principal de monitoramento e comparação de preços.
- `src/services/`: Integrações com APIs de preços e serviços de blockchain.
- `src/models/`: Definições de dados (Snapshots e Configurações).
- `src/bot/`: Interface via Telegram.
- `src/database/`: Configuração do SQLite com Sequelize.

## ⚙️ Como Usar

1.  Instale as dependências:
    ```bash
    npm install
    ```
2.  Configure o arquivo `.env` (use o `.env.example` como base).
3.  Inicie a aplicação:
    ```bash
    npm start
    ```

## Comandos do Bot Telegram

- `📊 Cotação Agora`: Executa uma verificação imediata.
- `💰 Saldo`: Mostra os saldos na rede Polygon.
- `⚙️ Configurações`: Exibe as configurações de banca e lucro.

## Próximos Passos (Objetivos Intermediários e Finais)

- Implementar execução de ordens na Binance via API.
- Implementar Swaps automáticos via ParaSwap/Kyber/Odos usando `ethers.js`.
- Adicionar comandos de execução manual no Bot.
- Implementar automação
