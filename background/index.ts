import injectMyWallet from "./injectWallet";
import { ethers } from "ethers";
import { getProvider, sepolia } from "../lib/rpc"
import * as Storage from "../utils/storage"
import { detectTokenType } from "../utils/chain"

const inject = async (tabId: number) => {
  try {
    await chrome.scripting.executeScript(
      {
        target: {
          tabId
        },
        world: "MAIN", // MAIN in order to access the window object
        func: injectMyWallet
      }
    )
    console.log("✅ Background script: myWallet 注入完成")
  } catch (error) {
    console.error("❌ Background script: 注入失败", error)
  }
}

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

async function getWallet() {
  const privateKey = await Storage.getItem("privateKey")
  if (!privateKey) return null
  return new ethers.Wallet(privateKey, await getProvider())
}

// 在用户手势中调用 openPopup：比如右键菜单/命令/内容脚本的同步回调
async function openPopupTo(route: string, search = "") {
  await chrome.storage.local.set({ popupIntent: { route, search } })
  // 必须在用户手势内，否则会报错
  // @ts-ignore
  await chrome.action.openPopup()
}

// 监听来自 content script 的消息
const handleContentScriptMessage = async (tabId: number, message: any, sender: any, sendResponse: (response: any) => void) => {
  if (message.type === 'WALLET_CONNECT_REQUEST' && message.source === 'contentScript') {
    console.log("📨 Background script 收到来自 content script 的连接请求")

    try {
      // 获取发送方的信息
      const origin = message.origin || 'unknown'

      // 保存待处理的连接请求
      await chrome.storage.local.set({
        pendingConnectRequest: {
          tabId: tabId,
          origin: origin,
          timestamp: Date.now()
        }
      })

      console.log("💾 已保存连接请求到存储")

      // 尝试打开扩展弹窗
      try {
        await chrome.action.openPopup()
        console.log("🔔 已打开扩展弹窗")
        chrome.tabs.sendMessage(tabId, {
          type: 'WALLET_CONNECT_RESPONSE',
          success: true,
          error: ""
        })
      } catch (popupError) {
        console.warn("⚠️ 无法自动打开弹窗，用户需要手动点击扩展图标")

        // 设置扩展图标徽章提醒用户
        await chrome.action.setBadgeText({
          text: "1",
          tabId: tabId
        })
        await chrome.action.setBadgeBackgroundColor({
          color: "#FF0000"
        })
      }

    } catch (error) {
      console.error("❌ 处理连接请求失败:", error)

      // 向 content script 发送失败响应
      chrome.tabs.sendMessage(tabId, {
        type: 'WALLET_CONNECT_RESPONSE',
        success: false,
        error: "扩展内部错误"
      })
    }
  }
  if (message.type === 'WALLET_SIGN_MESSAGE_REQUEST' && message.source === 'contentScript') {
    console.log("📨 Background script 收到来自 content script 的签名请求")
    try {
      const { message: msgToSign } = message
      if (!msgToSign) {
        throw new Error("缺少签名消息")
      }
      openPopupTo("/signMessage", `?tabId=${tabId}&message=${encodeURIComponent(msgToSign)}`)

    } catch (error) {
      console.error("❌ 处理签名请求失败:", error)
    }
  }
  if (message.type === 'WALLET_SIGN_MESSAGE_RESPONSE') {
    try {
      const { approved } = message
      if (approved) {
        const wallet = await getWallet()

        if (!wallet) {
          throw new Error("未找到钱包")
        }
        console.log("📨 Background script 收到来自 content script 的签名确认!!!", message)
        const { message: msgToSign } = message
        if (!msgToSign) {
          throw new Error("缺少签名消息")
        }
        // 使用 wallet 进行消息签名
        const signature = await wallet.signMessage(msgToSign)
        console.log("🖊️ 消息签名成功:", signature)
        chrome.tabs.sendMessage(tabId, {
          type: 'WALLET_SIGN_MESSAGE_RESPONSE',
          success: true,
          error: "",
          signature,
          message: msgToSign
        })
      } else {
        console.log("用户拒绝签名")
        chrome.tabs.sendMessage(tabId, {
          type: 'WALLET_SIGN_MESSAGE_RESPONSE',
          success: false,
          error: "用户拒绝签名"
        })
      }


    } catch (error) {
      console.error("❌ 处理签名确认失败:", error)
      chrome.tabs.sendMessage(tabId, { type: "WALLET_SIGN_MESSAGE_RESPONSE", success: false, error: error.message })
    }


  }
  if (message.type === 'WALLET_TRANSACTION_REQUEST') {
    console.log("📨 Background script 收到来自 content script 的交易请求", message)
    try {
      const { tx } = message
      if (!tx) {
        throw new Error("缺少交易信息")
      }
      const wallet = await getWallet()
      if (!wallet) {
        throw new Error("未找到钱包")
      }
      const receipt = await wallet.sendTransaction(tx);
      await receipt.wait(); // 等待链上确认交易
      console.log(receipt);
      chrome.runtime.sendMessage({ type: "WALLET_TRANSACTION_RESPONSE", success: true, receipt })
    } catch (error) {
      console.error("❌ 处理交易请求失败:", error)
    }
  }
  if (message.type === 'WALLET_GET_ACCOUNT_REQUEST') {
    console.log("📨 Background script 收到来自 content script 的账户请求")
    try {
      const wallet = await getWallet()
      if (!wallet) {
        throw new Error("未找到钱包")
      }
      const balanceWei = await wallet.getBalance()
      const formatEther = (ethers as any).utils?.formatEther ?? (ethers as any).formatEther
      const account = {
        address: wallet.address,
        balance: formatEther(balanceWei) // human-readable ETH string
      }
      console.log("📜 获取账户信息成功:", account)
      chrome.tabs.sendMessage(tabId, {
        type: 'WALLET_GET_ACCOUNT_RESPONSE',
        success: true,
        error: "",
        data: account
      })
    } catch (error) {
      console.error("❌ 处理账户请求失败:", error)
      chrome.tabs.sendMessage(tabId, {
        type: 'WALLET_GET_ACCOUNT_RESPONSE',
        success: false,
        error: error.message
      })
    }
  }
  if (message.type === 'WALLET_WATCH_ASSET') {
    console.log("📨 Background script 收到来自 content script 的资产监听请求")
    try {
      const { asset } = message
      if (!asset || !asset.address) {
        throw new Error("缺少资产信息")
      }
      const handleAddToken = async () => {
        try {
          const provider = await getProvider()
          const tokenType = await detectTokenType(asset.address)
          const tokenAddress = asset.address
          const tokenId = asset.tokenId || null
          let contract, balance, symbol
          const wallet = await getWallet()
          const walletAddress = wallet ? wallet.address : null
          let tokens = []
          const storedTokens = await Storage.getItem("tokens")
          if (storedTokens) {
            const _tokens = JSON.parse(storedTokens);
            tokens = _tokens.length ? _tokens : [];
          }

          if (tokenType === "ERC20") {
            contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
            balance = await contract.balanceOf(walletAddress)
            symbol = await contract.symbol()
            tokens = [...tokens, { address: tokenAddress, type: tokenType, balance: balance.toString(), symbol }]
          } else if (tokenType === "ERC721") {
            contract = new ethers.Contract(tokenAddress, ERC721_ABI, provider)
            balance = await contract.balanceOf(walletAddress)
            symbol = await contract.symbol()
            tokens = [...tokens, { address: tokenAddress, type: tokenType, balance: balance.toString(), symbol }]
          } else if (tokenType === "ERC1155" && tokenId) {
            contract = new ethers.Contract(tokenAddress, ERC1155_ABI, provider)
            balance = await contract.balanceOf(walletAddress, tokenId)
            tokens = [...tokens, { address: tokenAddress, type: tokenType, balance: balance.toString(), tokenId }]
          }
          Storage.setItem("tokens", JSON.stringify(tokens))
          return true
        } catch (err) {
          console.error("添加 token 失败", err)
          return false
        }
      }
      const result = await handleAddToken()
      chrome.tabs.sendMessage(tabId, {
        type: 'WALLET_WATCH_ASSET_RESPONSE',
        success: result,
        error: result ? "" : "添加资产失败"
      })
    } catch (error) {
      console.error("❌ 处理资产监听请求失败:", error)
      chrome.tabs.sendMessage(tabId, {
        type: 'WALLET_WATCH_ASSET_RESPONSE',
        success: false,
        error: error.message
      })
    }

  }
  if (message.type === 'WALLET_SWITCH_ETHEREUM_CHAIN_REQUEST') {
    console.log("📨 Background script 收到来自 content script 的切换链请求")
    try {
      const { chain } = message
      if (!chain || !chain.chainId) {
        throw new Error("缺少链信息")
      }
      const parseChainId = (cid: string | number): number => {
        if (typeof cid === "number") return cid
        if (typeof cid === "string") return parseInt(cid, cid.startsWith("0x") ? 16 : 10)
        return NaN
      }

      const chainIdNum = parseChainId(chain.chainId)
      if (Number.isNaN(chainIdNum)) {
        throw new Error("无效的 chainId")
      }

      const chainNameMap: Record<number, string> = {
        1: "ethereum",
        11155111: "sepolia",
        // 5: "goerli",
        // 137: "polygon",
        // 80001: "mumbai",
        // 10: "optimism",
        // 42161: "arbitrum",
        // 421614: "arbitrumSepolia",
        // 8453: "base",
        // 56: "bsc",
        // 97: "bscTestnet",
        // 43114: "avalanche",
        // 43113: "avalancheFuji",
        // 31337: "hardhat",
        // 59144: "linea",
        // 534352: "scroll"
      }

      const newNetwork = chainNameMap[chainIdNum] || `chain-${chainIdNum}`
      try {
        await Storage.setCurrentNetwork(newNetwork)
        const wallet = await getWallet()
        if (!wallet) {
          throw new Error("未找到钱包")
        }
        const balanceWei = await wallet.getBalance()
        const formatEther = (ethers as any).utils?.formatEther ?? (ethers as any).formatEther
        const account = {
          address: wallet.address,
          balance: formatEther(balanceWei) // human-readable ETH string
        }
        console.log("📜 获取账户信息成功:", account)
        chrome.tabs.sendMessage(tabId, {
          type: 'WALLET_SWITCH_ETHEREUM_CHAIN_RESPONSE',
          success: true,
          error: "",
          accountInfo: {
            ...account,
            chainId: chainIdNum
          }
        })
      } catch (error) {
        console.error("❌ 切换链失败:", error)
        chrome.tabs.sendMessage(tabId, {
          type: 'WALLET_SWITCH_ETHEREUM_CHAIN_RESPONSE',
          success: false,
          error: error.message
        })
      }
    } catch (error) {
      console.error("❌ 处理切换链请求失败:", error)
      chrome.tabs.sendMessage(tabId, {
        type: 'WALLET_SWITCH_ETHEREUM_CHAIN_RESPONSE',
        success: false,
        error: error.message
      })
    }
  }
  if (message.type === 'WALLET_ADD_ETHEREUM_CHAIN_REQUEST') {
    console.log("📨 Background script 收到来自 content script 的添加链请求")
    try {
      const { chain } = message
      if (!chain || !chain.chainId) {
        throw new Error("缺少链信息")
      }
      const parseChainId = (cid: string | number): number => {
        if (typeof cid === "number") return cid
        if (typeof cid === "string") return parseInt(cid, cid.startsWith("0x") ? 16 : 10)
        return NaN
      }

      const chainIdNum = parseChainId(chain.chainId)
      if (Number.isNaN(chainIdNum)) {
        throw new Error("无效的 chainId")
      }

      const newNetwork = `chain-${chainIdNum}`
      try {
        await Storage.setCurrentNetwork(newNetwork)
        const wallet = await getWallet()
        if (!wallet) {
          throw new Error("未找到钱包")
        }
        const balanceWei = await wallet.getBalance()
        const formatEther = (ethers as any).utils?.formatEther ?? (ethers as any).formatEther
        const account = {
          address: wallet.address,
          balance: formatEther(balanceWei) // human-readable ETH string
        }
        console.log("📜 获取账户信息成功:", account)
        chrome.tabs.sendMessage(tabId, {
          type: 'WALLET_ADD_ETHEREUM_CHAIN_RESPONSE',
          success: true,
          error: "",
          accountInfo: {
            ...account,
            chainId: chainIdNum
          }
        })
      } catch (error) {
        console.error("❌ 添加链失败:", error)
        chrome.tabs.sendMessage(tabId, {
          type: 'WALLET_ADD_ETHEREUM_CHAIN_RESPONSE',
          success: false,
          error: error.message
        })
      }
    } catch (error) {
      console.error("❌ 处理添加链请求失败:", error)
      chrome.tabs.sendMessage(tabId, {
        type: 'WALLET_ADD_ETHEREUM_CHAIN_RESPONSE',
        success: false,
        error: error.message
      })
    }
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Background script 收到来自 content script 的消息!!!!", message, sender.tab)

  if (sender.tab && sender.tab.id) {
    handleContentScriptMessage(sender.tab.id, message, sender, sendResponse)
  } else {
    handleContentScriptMessage(Number(message.tabId), message, sender, sendResponse)
  }
})

// 在页面更新时注入
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("🔄 页面更新，检查是否需要注入 myWallet:", tab.url)
  // 只在页面完成加载时注入
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    console.log("🔄 页面加载完成，开始注入 myWallet:", tab.url)
    inject(tabId)
  }
})

// 在标签页激活时也注入（备用机制）
chrome.tabs.onActivated.addListener((e) => {
  console.log("🔄 标签页激活，检查是否需要注入 myWallet")
  chrome.tabs.get(e.tabId, (tab) => {
    if (tab.url && !tab.url.startsWith('chrome://')) {
      console.log("🔄 标签页激活，注入 myWallet:", tab.url)
      inject(e.tabId)
    }
  })
})
