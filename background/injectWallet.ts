import "../types"
import { ethers } from "ethers"

export default function injectMyWallet() {
  console.log("🔧 正在通过 background script 注入 myWallet 对象...")

  // 检查是否已经注入过
  if (window.myWallet || window.myWalletInjected) {
    console.log("⚠️ myWallet 对象已存在，跳过注入")
    return
  }

  // 注入 myWallet 对象到页面的 window 对象
  window.myWallet = {
    connect: async () => {
      console.log("🔗 正在连接钱包...")
      try {
        // 通过 postMessage 向 content script 发送连接请求
        window.postMessage({
          type: 'WALLET_CONNECT_REQUEST',
          source: 'myWallet',
          timestamp: Date.now()
        }, '*')

        console.log("📤 已通过 postMessage 发送连接请求到 content script")
        // 等待用户授权
        const result = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("连接超时，用户未授权"))
          }, 30000) // 30秒超时

          // 监听扩展响应
          const handleMessage = (event) => {
            if (event.data && event.data.type === 'WALLET_CONNECT_RESPONSE') {
              console.log("📨 收到来自 background 的连接响应", event.data)
              clearTimeout(timeoutId)
              window.removeEventListener('message', handleMessage)

              if (event.data.success) {
                resolve(event.data.result)
              } else {
                reject(new Error(event.data.error || "用户拒绝连接"))
              }
            }
          }

          window.addEventListener('message', handleMessage)
        })
        console.log("✅ 钱包连接成功:", result)
        return result
      } catch (error) {
        console.error("❌ 连接失败:", error)
        throw error
      }

    },
    disconnect: async () => {
      console.log("🔄 正在断开钱包连接...")
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log("✅ 钱包断开连接成功")
      return { success: true, message: "钱包断开连接成功" }
    },
    getAccount: async () => {
      console.log("📜 获取账户信息...")
      return { address: "0x1234567890abcdef...", balance: 0 } // 示例返回值
    },
    signMessage: async (message: string): Promise<string> => {
      console.log(`✍️ 签名消息: ${message}`)

      window.postMessage({
        type: 'WALLET_SIGN_MESSAGE_REQUEST',
        source: 'myWallet',
        message,
        timestamp: Date.now()
      }, '*')

      const signature = await new Promise<string>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("签名超时，用户未授权"))
        }, 30000)

        const handleMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'WALLET_SIGN_MESSAGE_RESPONSE') {
            clearTimeout(timeoutId)
            window.removeEventListener('message', handleMessage)
            if (event.data.success) {
              resolve(event.data.signature as string)
            } else {
              reject(new Error(event.data.error || "用户拒绝签名"))
            }
          }
        }
        window.addEventListener('message', handleMessage)
      })
      console.log("🖊️ 签名结果:", signature)
      return signature
    },
    transaction: async (tx: ethers.providers.TransactionRequest) => {

    },
    getStatus: () => {
      console.log("📊 获取状态...")
      return { connected: true, address: "0x1234567890abcdef..." } // 假状态
    }
  }
  // 设置全局标志
  window.myWalletInjected = true

  console.log("🎉 myWallet 对象已成功注入到页面中")
  console.log("可用方法:", Object.keys(window.myWallet))

  // 触发自定义事件
  window.dispatchEvent(new CustomEvent('myWalletReady', {
    detail: { methods: Object.keys(window.myWallet) }
  }))

  // 同时注入 hello 对象作为测试
  window.hello = {
    world: "from background injected script",
    myWalletVersion: "1.0.0"
  }

  console.log("✅ hello 对象也已注入:", window.hello)
}