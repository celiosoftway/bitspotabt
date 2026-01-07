const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Config = sequelize.define('Config', {
  key: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

module.exports = Config;
