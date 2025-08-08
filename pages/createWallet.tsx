import React, { useState } from "react"
import { ethers } from "ethers"
import CryptoJS from "crypto-js"
import { message } from "antd"
import { WalletStore } from "~store/WalletStore"

const CreateWalletPopup = () => {
  const [mnemonic, setMnemonic] = useState("")
  const [password, setPassword] = useState("")
  const [address, setAddress] = useState("")
  const [success, setSuccess] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const { updateWallet } = WalletStore.useContainer()

  const generateWallet = () => {
    const wallet = ethers.Wallet.createRandom()
    const phrase = wallet.mnemonic.phrase
    const addr = wallet.address
    setMnemonic(phrase)
    setAddress(addr)
    setSuccess(false)
    setShowMnemonic(false)
  }

  const saveWallet = async () => {
    if (!mnemonic || !password) return alert("请输入密码并生成助记词")
    try {
      const encrypted = CryptoJS.AES.encrypt(mnemonic, password).toString()
      localStorage.setItem("encryptedMnemonic", encrypted)
      localStorage.setItem("address", address)
      updateWallet({ address, encryptedMnemonic: encrypted });
      setSuccess(true)
    } catch (err) {
      console.error("保存失败", err)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic)
    message.success("助记词已复制");
  }

  const buttonStyle = {
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
  } as const

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "#fff",
    color: "#f6851b",
    border: "2px solid #f6851b"
  } as const

  return (
    <div style={{ padding: 20, width: 300 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>创建钱包</h2>
      <button onClick={generateWallet} style={buttonStyle}>生成助记词</button>

      {mnemonic && (
        <>
          <div style={{
            position: "relative",
            width: "100%",
            height: 80,
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 12,
            padding: 8,
            background: "#f8f8f8",
            fontSize: 14,
            overflow: "hidden"
          }}>
            {showMnemonic ? (
              <div>{mnemonic}</div>
            ) : (
              <div style={{ color: "#888", textAlign: "center", lineHeight: "60px" }}>点击显示助记词</div>
            )}
            {!showMnemonic && (
              <button
                onClick={() => setShowMnemonic(true)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  border: "none",
                  background: "transparent"
                }}
              />
            )}
          </div>

          <button onClick={copyToClipboard} style={secondaryButtonStyle}>复制助记词</button>

          <input
            type="password"
            placeholder="设置访问密码"
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

          <button onClick={saveWallet} style={buttonStyle}>保存钱包</button>
        </>
      )}

      {success && <p style={{ color: "green", marginTop: 12 }}>钱包已加密保存 🎉</p>}
    </div>
  )
}

export default CreateWalletPopup
