// 定义一个WalletInfo类型
export interface WalletInfo {
  address: string; // 钱包地址
  encryptedMnemonic?: string; // 助记词，可选
  privateKey?: string; // 私钥，可选
  balance?: number; // 钱包余额，可选
}