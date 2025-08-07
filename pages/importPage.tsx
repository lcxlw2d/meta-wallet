import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import * as bip39 from "bip39"
import { ethers } from "ethers"


export default function ImportPage() {
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleImport = async () => {
    const cleaned = input.trim()
    setError("")
    setLoading(true)

    try {
      const provider = new ethers.JsonRpcProvider(
        `https://sepolia.infura.io/v3/24704e9c4ee645e5a554ce2c53a0e20b`
      );
      let wallet: ethers.Wallet
      let type: "mnemonic" | "privateKey"

      if (bip39.validateMnemonic(cleaned)) {
        // 助记词导入
        const seed = await bip39.mnemonicToSeed(cleaned)
        const uint8Seed = Uint8Array.from(seed)
        const hdNode = ethers.HDNodeWallet.fromSeed(uint8Seed).derivePath("m/44'/60'/0'/0/0")
        wallet = new ethers.Wallet(hdNode.privateKey)
        type = "mnemonic"
      } else if (/^(0x)?[0-9a-fA-F]{64}$/.test(cleaned)) {
        // 私钥导入（支持带或不带0x前缀）
        const pk = cleaned.startsWith("0x") ? cleaned : `0x${cleaned}`
        wallet = new ethers.Wallet(pk, provider)
        type = "privateKey"
      } else {
        setError("无效的助记词或私钥")
        setLoading(false)
        return
      }

      // 存储
      await chrome.storage.local.set({
        address: wallet.address,
        type,
        mnemonic: type === "mnemonic" ? cleaned : "",
        privateKey: type === "privateKey" ? wallet.privateKey : ""
      })

      navigate("/wallet")
    } catch (e) {
      console.error(e)
      setError("导入失败，请确认输入正确" + JSON.stringify(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, width: 320 }}>
      <h2>导入钱包</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="请输入助记词或私钥"
        style={{ width: "100%", height: 100, marginBottom: 12 }}
      />
      {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}
      <button
        onClick={handleImport}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 0",
          background: "#f6851b",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        {loading ? "导入中..." : "导入钱包"}
      </button>
    </div>
  )
}
