const { Scenes } = require("telegraf");
const { defineBanca } = require("../services/configService"); // ajuste caminho conforme seu projeto

const defineBancaScene = new Scenes.WizardScene(
  "defineBancaScene",

  // 1️⃣ Passo 1: Valor da banca
  async (ctx) => {
    await ctx.reply("💰 Informe o valor da banca em **BRL** (ex: 1500):");
    return ctx.wizard.next();
  },

  // 2️⃣ Passo 2: Lucro mínimo absoluto
  async (ctx) => {
    const valor = parseFloat(ctx.message?.text?.trim());
    if (isNaN(valor) || valor <= 0) {
      await ctx.reply("❌ Envie um número válido para o valor da banca.");
      return;
    }

    ctx.wizard.state.valor = valor;
    await ctx.reply("📈 Informe o lucro mínimo **em BRL** (ex: 10):");
    return ctx.wizard.next();
  },

  // 3️⃣ Passo 3: Porcentagem mínima
  async (ctx) => {
    const lucroMin = parseFloat(ctx.message?.text?.trim());
    if (isNaN(lucroMin) || lucroMin < 0) {
      await ctx.reply("❌ Envie um número válido para o lucro mínimo.");
      return;
    }

    ctx.wizard.state.lucroMin = lucroMin;
    await ctx.reply("📊 Informe a **porcentagem mínima** de lucro (ex: 1.5):");
    return ctx.wizard.next();
  },

  // 4️⃣ Passo 4: Confirmar e salvar
  async (ctx) => {
    const percentMin = parseFloat(ctx.message?.text?.trim());
    if (isNaN(percentMin) || percentMin < 0) {
      await ctx.reply("❌ Envie uma porcentagem válida.");
      return;
    }

    const { valor, lucroMin } = ctx.wizard.state;
    const x = await defineBanca(valor, lucroMin, percentMin);

    if (x === 1) {
      await ctx.reply(`✅ Banca definida com sucesso!\n\n💰 Valor: R$ ${valor}\n📈 Lucro mínimo: R$ ${lucroMin}\n📊 Porcentagem mínima: ${percentMin}%`);
    } else {
      await ctx.reply("❌ Erro ao definir a banca.");
    }

    return ctx.scene.leave();
  }
);

module.exports = defineBancaScene;
