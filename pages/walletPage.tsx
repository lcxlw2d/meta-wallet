import React, { useState, useEffect } from "react"
import { WalletStore } from "~store/WalletStore"
import { ethers } from "ethers"
import { detectTokenType } from "../utils/chain"
import { useNavigate } from "react-router-dom"
import TxList from "~components/txList"

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)"
]

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)"
]

const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)"
]

const WalletInfoPage = () => {
  const { wallet, updateWallet, tokenList, updateTokens, clearWallet } = WalletStore.useContainer()
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenType, setTokenType] = useState("ERC20")
  const [tokenId, setTokenId] = useState("")
  const [tokens, setTokens] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchWalletInfo = async () => {
      const storedWallet = localStorage.getItem("address")

      if (storedWallet) {
        try {
          const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/24704e9c4ee645e5a554ce2c53a0e20b")
          const balance = await provider.getBalance(storedWallet)
          const ethBalance = ethers.utils.formatEther(balance)
          console.log(`钱包地址: ${storedWallet}, 以太坊余额: ${ethBalance} ETH`)
          updateWallet({ address: storedWallet, balance: parseFloat(ethBalance) })
        } catch (error) {
          console.error("获取钱包信息失败", error)
        }
      }
    }
    fetchWalletInfo()
    const fetchStoredTokens = async () => {
      const storedTokens = localStorage.getItem("tokens")
      if (storedTokens) {
        const _tokens = JSON.parse(storedTokens);
        setTokens(_tokens.length ? _tokens : []);
      }
    }
    fetchStoredTokens()
  }, [])

  useEffect(() => {
    updateTokens(tokens)
    console.log("Updated tokens:", tokens)
    localStorage.setItem("tokens", JSON.stringify(tokens))
  }, [tokens])

  useEffect(() => {
    console.log(tokenAddress)
    detectTokenType(tokenAddress).then(_tokenType => {
      console.log("检测到的 Token 类型:", _tokenType)
      setTokenType(_tokenType)
    })
  }, [tokenAddress])

  const handleAddToken = async () => {
    if (!wallet?.address || !tokenAddress) return
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/24704e9c4ee645e5a554ce2c53a0e20b")
      let contract, balance, symbol

      if (tokenType === "ERC20") {
        contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
        balance = await contract.balanceOf(wallet.address)
        symbol = await contract.symbol()
        setTokens(prev => [...prev, { address: tokenAddress, type: tokenType, balance: balance.toString(), symbol }])
      } else if (tokenType === "ERC721") {
        contract = new ethers.Contract(tokenAddress, ERC721_ABI, provider)
        balance = await contract.balanceOf(wallet.address)
        symbol = await contract.symbol()
        setTokens(prev => [...prev, { address: tokenAddress, type: tokenType, balance: balance.toString(), symbol }])
      } else if (tokenType === "ERC1155" && tokenId) {
        contract = new ethers.Contract(tokenAddress, ERC1155_ABI, provider)
        balance = await contract.balanceOf(wallet.address, tokenId)
        setTokens(prev => [...prev, { address: tokenAddress, type: tokenType, balance: balance.toString(), tokenId }])
      }
    } catch (err) {
      console.error("添加 token 失败", err)
    }
  }

  const handleRemoveToken = (indexToRemove: number) => {
    const updated = tokens.filter((_, index) => index !== indexToRemove)
    setTokens(updated)
  }

  const getTokenIcon = (symbol?: string) => {
    if (!symbol) return null
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`
  }

  return (
    <div style={{ padding: 20, width: 300 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>钱包信息</h2>

      {wallet?.address && (
        <>
          <p><strong>地址：</strong> {wallet.address}</p>
          <p><strong>ETH Balance：</strong> {wallet.balance} ETH</p>

          <button
            style={{ ...buttonStyle }}
            onClick={() => navigate('/transaction')}
          >
            发送交易
          </button>

          <h3 style={{ marginTop: 30 }}>添加 Token</h3>

          <input
            placeholder="合约地址"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 8,
              borderRadius: 4,
              border: "1px solid #ccc"
            }}
          />
          <p>{tokenType}</p>

          {/* <select
            value={tokenType}
            onChange={(e) => setTokenType(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 8,
              borderRadius: 4,
              border: "1px solid #ccc"
            }}>
            <option value="ERC20">ERC-20</option>
            <option value="ERC721">ERC-721</option>
            <option value="ERC1155">ERC-1155</option>
          </select> */}

          {tokenType === "ERC1155" && (
            <input
              placeholder="Token ID (仅 ERC-1155 需要)"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginBottom: 8,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          )}

          <button onClick={handleAddToken} style={{ ...buttonStyle }}>
            添加 Token
          </button>

          {tokens.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>已添加的 Token：</h4>
              {tokens.map((token, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: 14,
                    marginBottom: 12,
                    padding: 8,
                    background: "#f4f4f4",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {token.symbol && (
                      <img
                        src={getTokenIcon(token.symbol)}
                        alt={token.symbol}
                        style={{ width: 20, height: 20, borderRadius: "50%" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <span>
                      <strong>{token.symbol || token.type}</strong>：{(token.balance / 1000000000000000000)} {token.symbol} {token.tokenId && `(Token ID: ${token.tokenId})`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveToken(index)}
                    style={{
                      padding: "4px 8px",
                      fontSize: 12,
                      background: "#e74c3c",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}>
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}

          <TxList />

          <button onClick={clearWallet} style={{ ...buttonStyle }}>
            断开钱包
          </button>
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

export default WalletInfoPage
