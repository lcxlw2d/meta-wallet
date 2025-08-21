import injectMyWallet from "./injectWallet";
import { ethers } from "ethers";
import { getProvider, sepolia } from "../lib/rpc"
import * as Storage from "../utils/storage"

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

async function getWallet() {
  const privateKey = await Storage.getItem("privateKey")
  if (!privateKey) return null
  return new ethers.Wallet(privateKey, getProvider(sepolia))
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
      openPopupTo("/signMessage", `?message=${encodeURIComponent(msgToSign)}`)

    } catch (error) {
      console.error("❌ 处理签名请求失败:", error)
    }
  }
  if (message.type === 'WALLET_SIGN_MESSAGE_RESPONSE') {
    try {
      const wallet = await getWallet()

      if (!wallet) {
        throw new Error("未找到钱包")
      }
      const { message: msgToSign } = message
      if (!msgToSign) {
        throw new Error("缺少签名消息")
      }
      // 使用 wallet 进行消息签名
      const signature = await wallet.signMessage(msgToSign)
      console.log("🖊️ 消息签名成功:", signature)
      chrome.runtime.sendMessage({
        type: "WALLET_SIGN_MESSAGE_RESPONSE_AFTER",
        success: true,
        signature,
        message: msgToSign
      })
      // sendResponse({ type: "WALLET_SIGN_MESSAGE_RESPONSE", success: true, signature })
    } catch (error) {
      console.error("❌ 处理签名确认失败:", error)
      chrome.runtime.sendMessage({ type: "WALLET_SIGN_MESSAGE_RESPONSE_AFTER", success: false, error: error.message })
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
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Background script 收到来自 content script 的消息!!!!", message, sender)

  if (sender.tab && sender.tab.id) {
    handleContentScriptMessage(sender.tab.id, message, sender, sendResponse)
  } else {
    handleContentScriptMessage(null, message, sender, sendResponse)
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
