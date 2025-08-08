import React, { useState } from "react"
import CryptoJS from "crypto-js"
import { WalletStore } from "../store/WalletStore"
import { ethers } from "ethers"
import { useNavigate } from "react-router-dom"

const LoginWalletPage = () => {
  const { updateWallet } = WalletStore.useContainer()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const result = await chrome.storage.local.get(["encryptedMnemonic"])
      const encrypted = result.encryptedMnemonic

      if (!encrypted) {
        setError("未检测到已创建的钱包")
        setLoading(false)
        return
      }

      const bytes = CryptoJS.AES.decrypt(encrypted, password)
      const decryptedMnemonic = bytes.toString(CryptoJS.enc.Utf8)

      if (!decryptedMnemonic) {
        setError("密码错误")
        setLoading(false)
        return
      }

      const wallet = ethers.Wallet.fromMnemonic(decryptedMnemonic)
      updateWallet({
        address: wallet.address,
        // mnemonic: decryptedMnemonic,
        privateKey: wallet.privateKey
      })

      navigate("/import")
    } catch (err) {
      console.error(err)
      setError("登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, width: 300 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>钱包登录</h2>

      <input
        type="password"
        placeholder="请输入密码"
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
        onClick={handleLogin}
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
          cursor: "pointer",
          opacity: loading ? 0.7 : 1
        }}>
        {loading ? "登录中..." : "登录钱包"}
      </button>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </div>
  )
}

export default LoginWalletPage
