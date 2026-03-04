const { ethers } = require("ethers");

function toBaseUnit(amount, decimals) {
  return ethers.parseUnits(amount.toString(), decimals).toString();
}

function fromBaseUnit(amount, decimals) {
  return Number(ethers.formatUnits(amount.toString(), decimals));
}

module.exports = {
  toBaseUnit,
  fromBaseUnit
};