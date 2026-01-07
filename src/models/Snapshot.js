const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Snapshot = sequelize.define('Snapshot', {
  timestamp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  strategy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bancaBRL: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  amountBRL: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  exchange: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amountUSDT: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  dexName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dexPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  profit: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  percent: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

module.exports = Snapshot;
