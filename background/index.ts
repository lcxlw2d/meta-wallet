import walletMethods from "./walletService"
import { PortMessage } from "~utils/message"

/* background 初始化 */
const init = () => {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") { // 这里使用的端口 name 为 popup 用来标识是 popup 创建的连接
      const pm = new PortMessage(port) // 使用PortMessage来优化 port
      pm.listen((data) => { //监听事件同时，约定 method，用于调用 background 中的方法
        if (data.method) {
          return walletMethods[data.method].apply(null, data.params) // 执行方法
        }
        return null
      })
      port.onDisconnect.addListener(() => {
        // 断开连接的处理。
      })
      return
    }
  })
}

init()
