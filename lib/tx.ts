import { BigNumber, ethers } from "ethers"
import type { ChainConfig } from "./rpc"

export interface PopulateResult {
  tx: ethers.providers.TransactionRequest
  provider: ethers.providers.JsonRpcProvider
}

export async function buildEthTransaction(
  chain: ChainConfig,
  from: string,
  to: string,
  valueWei: BigNumber,
  overrides: Partial<ethers.providers.TransactionRequest> = {}
): Promise<PopulateResult> {
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl, { chainId: chain.chainId, name: chain.name })
  const nonce = await provider.getTransactionCount(from, "latest")
  const feeData = await provider.getFeeData()

  const tx: ethers.providers.TransactionRequest = {
    chainId: chain.chainId,
    from,
    to,
    value: valueWei,
    nonce,
    type: 2,
    maxFeePerGas: overrides.maxFeePerGas ?? feeData.maxFeePerGas ?? ethers.utils.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: overrides.maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas ?? ethers.utils.parseUnits("1.5", "gwei"),
    gasLimit: overrides.gasLimit,
    data: overrides.data
  }

  if (!tx.gasLimit) {
    const est = await provider.estimateGas(tx)
    tx.gasLimit = est.mul(120).div(100) // +20% buffer
  }

  return { tx, provider }
}

export async function buildErc20TransferTx(
  chain: ChainConfig,
  from: string,
  tokenAddress: string,
  to: string,
  amountHuman: string,
  decimals: number,
  overrides: Partial<ethers.providers.TransactionRequest> = {}
): Promise<PopulateResult> {
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl, { chainId: chain.chainId, name: chain.name })
  const nonce = await provider.getTransactionCount(from, "latest")
  const feeData = await provider.getFeeData()
  const value = ethers.utils.parseUnits(amountHuman, decimals)

  const iface = new ethers.utils.Interface(["function transfer(address to, uint256 value)"])
  const data = iface.encodeFunctionData("transfer", [to, value])

  const tx: ethers.providers.TransactionRequest = {
    chainId: chain.chainId,
    from,
    to: tokenAddress,
    data,
    nonce,
    type: 2,
    maxFeePerGas: overrides.maxFeePerGas ?? feeData.maxFeePerGas ?? ethers.utils.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: overrides.maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas ?? ethers.utils.parseUnits("1.5", "gwei"),
    gasLimit: overrides.gasLimit
  }

  if (!tx.gasLimit) {
    const est = await provider.estimateGas(tx)
    tx.gasLimit = est.mul(120).div(100)
  }
  return { tx, provider }
}