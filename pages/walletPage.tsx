import React, { useEffect, useState } from "react"
import { ethers } from "ethers"

export default function WalletPage() {
  const [address, setAddress] = useState("")
  const [mnemonic, setMnemonic] = useState("")
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [balance, setBalance] = useState("")

  useEffect(() => {
    // 获取存储信息
    chrome.storage.local.get(["address", "mnemonic"], async (res) => {
      if (res.address) {
        setAddress(res.address)
        setMnemonic(res.mnemonic || "")

        // 获取 ETH 余额（使用默认 provider 或 RPC）
        try {
          const provider = ethers.getDefaultProvider("mainnet")
          const balanceBigInt = await provider.getBalance(res.address)
          const ether = ethers.formatEther(balanceBigInt)
          setBalance(parseFloat(ether).toFixed(4))
        } catch (err) {
          console.error("Failed to get balance", err)
          setBalance("N/A")
        }
      }
    })
  }, [])

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      alert("地址已复制")
    }
  }

  return (
    <div style={{ padding: 20, width: 320 }}>
      <h2>钱包信息</h2>
      <p><strong>地址：</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "未导入"}</p>
      <p><strong>余额：</strong> {balance} ETH</p>
      <button onClick={handleCopy} style={buttonStyle}>复制地址</button>

      {mnemonic && (
        <>
          <button onClick={() => setShowMnemonic(!showMnemonic)} style={buttonStyle}>
            {showMnemonic ? "隐藏助记词" : "查看助记词"}
          </button>
          {showMnemonic && (
            <div style={{
              background: "#f8f8f8",
              padding: 12,
              borderRadius: 6,
              marginTop: 10,
              fontSize: 14,
              color: "#333"
            }}>
              {mnemonic}
            </div>
          )}
        </>
      )}
    </div>
  )
}

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
