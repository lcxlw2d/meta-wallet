/**钱包的数据存储 */
import { createContainer } from 'unstated-next';
import { useState } from "react"

import type { WalletInfo } from '../types'; // 假设你有一个 WalletInfo 类型定义

const useWalletStore = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [tokenList, setTokenList] = useState<any[]>([])

  const updateWallet = (info: WalletInfo) => setWallet(info)
  const clearWallet = () => {
    setWallet(null)
    localStorage.removeItem("address")
    localStorage.removeItem("type")
    localStorage.removeItem("privateKey")
    setTokenList([])
    localStorage.removeItem("tokens")
    window.location.reload() // 刷新页面以清除状态
  }
  const updateTokens = (newTokens: any[]) => setTokenList(newTokens)

  return {
    wallet,
    updateWallet,
    clearWallet,
    tokenList,
    updateTokens,
  }
};
export const WalletStore = createContainer(useWalletStore);