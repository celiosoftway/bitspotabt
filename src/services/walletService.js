const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com');
const wallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;

const USDT_ADDRESS = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';
const BRLA_ADDRESS = '0xe6a537a407488807f0bbeb0038b79004f19dddfb';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

async function getBalances() {
  if (!wallet) return null;
  
  const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
  const brlaContract = new ethers.Contract(BRLA_ADDRESS, ERC20_ABI, provider);

  const [usdtBal, brlaBal, maticBal] = await Promise.all([
    usdtContract.balanceOf(wallet.address),
    brlaContract.balanceOf(wallet.address),
    provider.getBalance(wallet.address)
  ]);

  return {
    address: wallet.address,
    USDT: ethers.formatUnits(usdtBal, 6),
    BRLA: ethers.formatUnits(brlaBal, 18),
    MATIC: ethers.formatEther(maticBal)
  };
}

module.exports = { getBalances, wallet, provider };
