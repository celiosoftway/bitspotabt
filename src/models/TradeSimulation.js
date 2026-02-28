const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const TradeSimulation = sequelize.define('TradeSimulation', {

  timestamp: {
    type: DataTypes.STRING,
    allowNull: false
  },

  banca_utilizada: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  dex: {
    type: DataTypes.STRING,
    allowNull: false
  },

  lucro_bruto: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  taxas: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  lucro_liquido: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  saldo_apos_trade: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  percent: {
    type: DataTypes.FLOAT,
    allowNull: false
  }

});

module.exports = TradeSimulation;