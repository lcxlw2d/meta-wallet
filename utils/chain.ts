import { ethers } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { getProvider } from "../lib/rpc";


// 2. ERC165 检测 ABI
const ERC165_ABI = ["function supportsInterface(bytes4) view returns (bool)"];

// 3. ERC20 检测 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

// 4. ERC165 接口 ID
const INTERFACE_IDS = {
  ERC721: "0x80ac58cd",
  ERC1155: "0xd9b67a26"
};

// 5. EIP-1967 代理合约槽位
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

// 检查是否是代理合约，并获取实现合约地址
async function getImplementationAddress(address) {
  try {
    const provider = await getProvider();
    const storageValue = await provider.getStorageAt(address, IMPLEMENTATION_SLOT);
    if (storageValue && storageValue !== "0x" && storageValue !== ethers.constants.HashZero) {
      return ethers.utils.getAddress("0x" + storageValue.slice(-40));
    }
  } catch (err) {
    // 忽略错误
  }
  return address;
}

// 主检测函数
export async function detectTokenType(address) {
  if (!address) return '';
  // 1. 如果是代理，获取实现合约地址
  address = await getImplementationAddress(address);
  console.log("检测地址:", address);
  // 2. 检查 ERC165
  const provider = await getProvider();

  const erc165 = new ethers.Contract(address, ERC165_ABI, provider);
  try {
    if (await erc165.supportsInterface(INTERFACE_IDS.ERC721)) {
      return "ERC721";
    }
    if (await erc165.supportsInterface(INTERFACE_IDS.ERC1155)) {
      return "ERC1155";
    }
  } catch (err) {
    // 可能不是 ERC165
  }

  // 3. 检查 ERC20
  const erc20 = new ethers.Contract(address, ERC20_ABI, provider);
  try {
    const [name, symbol, decimals] = await Promise.all([
      erc20.name(),
      erc20.symbol(),
      erc20.decimals()
    ]);
    console.log(`检测到 ERC20: ${name} (${symbol})`);
    return "ERC20";
  } catch (err) {
    return "Unknown / Non-standard";
  }
}