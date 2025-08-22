import React, { useState } from 'react';
import { ethers } from 'ethers';
import { WalletStore } from "~store/WalletStore"
import * as Storage from "~utils/storage"
import { getProvider, sepolia } from "../lib/rpc"
import { useNavigate } from '~node_modules/react-router-dom/dist';

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  margin: "10px 0",
  background: "#f6851b",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer"
}

const TransactionPage: React.FC = () => {
  const [account, setAccount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const navigate = useNavigate();

  const { wallet, updateWallet, tokenList, updateTokens, clearWallet } = WalletStore.useContainer()

  async function getWallet() {
    const privateKey = await Storage.getItem("privateKey")
    if (!privateKey) return null
    return new ethers.Wallet(privateKey, await getProvider())
  }

  // Send transaction
  const sendTransaction = async () => {
    console.log("wallet in transaction page:", wallet, recipient, amount);
    if (!recipient || !amount) {
      setStatus('请输入收款地址和金额');
      return;
    }
    // 基本校验
    if (!ethers.utils.isAddress(recipient.trim())) {
      alert("收款地址无效")
      return
    }
    const amt = amount.trim()
    if (!amt || Number.isNaN(Number(amt)) || Number(amt) <= 0) {
      alert("转账金额无效")
      return
    }
    try {
      const provider = await getProvider();
      const w = await getWallet();
      if (!w) {
        setStatus('未找到钱包，请先创建或导入钱包');
        return;
      }
      // 使用 wallet 实例作为 signer
      (provider as any).getSigner = () => w.connect(provider);

      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.utils.parseEther(amount),
      });
      const receipt = await tx.wait();
      console.log('交易回执:', receipt);
      // 根据回执判断交易状态
      if (receipt.status === 1) {
        setStatus(`交易成功，hash: ${tx.hash}`);
        navigate(-1);
      } else {
        setStatus(`交易失败，hash: ${tx.hash}`);
      }
    } catch (err: any) {
      setStatus(`交易失败: ${err.message}`);
    }
  };

  return (
    <div style={{ minWidth: 300, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>链上转账</h2>
      {wallet.address && (
        <div style={{ marginBottom: 16 }}>
          <strong>我的账户：</strong>
          <div style={{ wordBreak: 'break-all' }}>{wallet.address}</div>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <strong>收款地址：</strong>
        <input
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            borderRadius: 4,
            border: "1px solid #ccc"
          }}
          placeholder="0x..."
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>金额 (ETH)：</strong>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            borderRadius: 4,
            border: "1px solid #ccc"
          }}
          placeholder="0.01"
        />
      </div>
      <button onClick={sendTransaction} disabled={!wallet.address} style={{ ...buttonStyle }}>
        转账
      </button>
      {status && <div style={{ marginTop: 16, color: 'blue' }}>{status}</div>}
    </div>
  );
};

export default TransactionPage;