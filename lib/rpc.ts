import { ethers } from "ethers"
import * as Storage from "../utils/storage"
export interface ChainConfig {
  chainId: number
  name: string
  rpcUrl: string
  symbol: string
}
export const sepolia: ChainConfig = {
  chainId: 11155111,
  name: "sepolia",
  rpcUrl: `https://sepolia.infura.io/v3/24704e9c4ee645e5a554ce2c53a0e20b`,
  symbol: "ETH"
}

export const ethereum: ChainConfig = {
  chainId: 1,
  name: "ethereum",
  rpcUrl: `https://mainnet.infura.io/v3/24704e9c4ee645e5a554ce2c53a0e20b`,
  symbol: "ETH"
}
export const chains: ChainConfig[] = [
  sepolia,
  ethereum
]

export async function getProvider() {
  const currentNetwork = await Storage.getCurrentNetwork()
  const chain: ChainConfig = chains.find(c => c.name === currentNetwork) || sepolia
  return new ethers.providers.JsonRpcProvider(chain.rpcUrl, {
    name: chain.name,
    chainId: chain.chainId
  })
}