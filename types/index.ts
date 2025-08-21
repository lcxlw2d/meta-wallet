import { ethers } from 'ethers';
export interface WalletInfo {
  address: string; // 钱包地址
  encryptedMnemonic?: string; // 助记词，可选
  privateKey?: string; // 私钥，可选
  balance?: number; // 钱包余额，可选
}

// 扩展 Window 接口以包含自定义属性
declare global {
  interface Window {
    myWallet?: {
      connect: () => Promise<any>
      disconnect: () => Promise<any>
      getAccount: () => Promise<any>
      signMessage: (message: string) => Promise<string>,
      transaction: (tx: ethers.providers.TransactionRequest) => Promise<any>,
      getStatus: () => any
    }
    myWalletInjected?: boolean
    hello?: {
      world: string
      myWalletVersion?: string
      coolNumber?: number
    }
  }
}

export { }