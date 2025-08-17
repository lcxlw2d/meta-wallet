import { ethers } from "ethers"

export interface ChainConfig {
  chainId: number
  name: string
  rpcUrl: string
  symbol: string
}

export const sepolia: ChainConfig = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: `https://sepolia.infura.io/v3/24704e9c4ee645e5a554ce2c53a0e20b`,
  symbol: "ETH"
}

export function getProvider(chain: ChainConfig) {
  return new ethers.providers.JsonRpcProvider(chain.rpcUrl, {
    name: chain.name,
    chainId: chain.chainId
  })
}