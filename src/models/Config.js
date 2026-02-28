const { DataTypes } = require('sequelize');
const sequelize = require('../database');

(async() => {await sequelize.sync();})()

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
