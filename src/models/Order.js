const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Order = sequelize.define('Order', {

  status: {
    type: DataTypes.STRING,
    allowNull: false
  },

  amountBRL: DataTypes.FLOAT,
  amountUSDT: DataTypes.FLOAT,

  cexName: DataTypes.STRING,
  cexPrice: DataTypes.FLOAT,

  dexNameOpen: DataTypes.STRING,
  dexQuoteOpen: DataTypes.FLOAT,

  usdtReceived: DataTypes.FLOAT,

  dexNameExecute: DataTypes.STRING,
  dexQuoteExecute: DataTypes.FLOAT,

  profitExpected: DataTypes.FLOAT,
  profitReal: DataTypes.FLOAT,

  withdrawETA: DataTypes.DATE,

  openedAt: DataTypes.DATE,
  withdrawCompletedAt: DataTypes.DATE,
  executedAt: DataTypes.DATE

});

module.exports = Order;