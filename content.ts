import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

window.addEventListener("message", (event: MessageEvent) => {
  // 只处理来自同一个窗口的消息
  if (event.source !== window) return
  // 只处理我们关心的消息类型
  if (event.data && event.data.source === 'myWallet') {
    console.log("🌉 Content script 收到页面的连接请求???", event.data)
    // 转发消息到 background script
    if (event.data.type === 'WALLET_CONNECT_REQUEST') {
      chrome.runtime.sendMessage({
        type: 'WALLET_CONNECT_REQUEST',
        source: 'contentScript',
        timestamp: event.data.timestamp,
        origin: window.location.origin,
        data: event.data.data
      })
    }
    if (event.data.type === 'WALLET_SIGN_MESSAGE_REQUEST') {
      chrome.runtime.sendMessage({
        type: 'WALLET_SIGN_MESSAGE_REQUEST',
        source: 'contentScript',
        timestamp: event.data.timestamp,
        origin: window.location.origin,
        message: event.data.message
      })
    }
    if (event.data.type === 'WALLET_SIGN_MESSAGE_RESPONSE') {
      chrome.runtime.sendMessage({
        type: 'WALLET_SIGN_MESSAGE_RESPONSE',
        source: 'contentScript',
        timestamp: event.data.timestamp,
        origin: window.location.origin,
        message: event.data.message
      })
    }
    if (event.data.type === 'WALLET_GET_ACCOUNT_REQUEST') {
      chrome.runtime.sendMessage({
        type: 'WALLET_GET_ACCOUNT_REQUEST',
        source: 'contentScript',
        timestamp: event.data.timestamp,
        origin: window.location.origin
      })
    }
    if (event.data.type === 'WALLET_WATCH_ASSET') {
      chrome.runtime.sendMessage({
        type: 'WALLET_WATCH_ASSET',
        source: 'contentScript',
        timestamp: event.data.timestamp,
        origin: window.location.origin,
        asset: event.data.asset
      })
    }
    if (event.data.type === 'WALLET_SWITCH_ETHEREUM_CHAIN_REQUEST') {
      chrome.runtime.sendMessage({
        type: 'WALLET_SWITCH_ETHEREUM_CHAIN_REQUEST',
        source: 'contentScript',
        timestamp: event.data.timestamp,
        origin: window.location.origin,
        chain: event.data.chain
      })
    }

    console.log(event.data, "🌉 Content script 收到页面消息")
  }
})

// 监听来自 background script 的响应
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🌉 Content script 收到 background 响应", message)
  if (message.type === 'WALLET_CONNECT_RESPONSE' || message.type === 'WALLET_SIGN_MESSAGE_RESPONSE' || message.type === 'WALLET_GET_ACCOUNT_RESPONSE' || message.type === 'WALLET_WATCH_ASSET_RESPONSE' || message.type === 'WALLET_SWITCH_ETHEREUM_CHAIN_RESPONSE') {
    // 转发响应到页面
    window.postMessage(message, '*')
  }
})

console.log("🌉 Message bridge content script 已加载")