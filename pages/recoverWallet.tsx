import React, { useState } from "react"
import CryptoJS from "crypto-js"
import { ethers } from "ethers"

const RecoverWalletPage = () => {
  const [password, setPassword] = useState("")
  const [mnemonic, setMnemonic] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [error, setError] = useState("")

  const handleRecover = async () => {
    setError("")
    try {
      const encrypted = localStorage.getItem("encryptedMnemonic")

      if (!encrypted) {
        setError("未找到已保存的钱包信息")
        return
      }

      const bytes = CryptoJS.AES.decrypt(encrypted, password)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)

      if (!decrypted) {
        setError("密码错误，解密失败")
        return
      }

      setMnemonic(decrypted)

      const wallet = ethers.Wallet.fromMnemonic(decrypted)
      setPrivateKey(wallet.privateKey)
    } catch (err) {
      console.error(err)
      setError("恢复失败，请重试")
    }
  }

  return (
    <div style={{ padding: 20, width: 300 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>欢迎回来</h2>

      <input
        type="password"
        placeholder="输入访问密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 14,
          borderRadius: 6,
          border: "1px solid #ccc",
          marginBottom: 12
        }}
      />

      <button
        onClick={handleRecover}
        style={{
          width: "100%",
          padding: "12px 0",
          background: "#f6851b",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          marginBottom: 12
        }}>
        解密并恢复钱包
      </button>

      {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

      {mnemonic && (
        <div style={{ marginBottom: 12 }}>
          <h4>助记词:</h4>
          <p style={{ fontSize: 14, background: "#f8f8f8", padding: 10, borderRadius: 6 }}>{mnemonic}</p>
        </div>
      )}

      {privateKey && (
        <div>
          <h4>私钥:</h4>
          <p style={{ fontSize: 14, background: "#f8f8f8", padding: 10, borderRadius: 6 }}>{privateKey}</p>
        </div>
      )}
    </div>
  )
}

export default RecoverWalletPage
