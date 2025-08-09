import walletMethods from "./walletService"
import { PortMessage } from "~utils/message"

/* background 初始化 */
const init = () => {
  chrome.runtime.onConnect.addListener((port) => {
    console.log("Background script connected to port:", port.name)
    port.postMessage({ greeting: "hello from background script" });
    if (port.name === "popup") { // 这里使用的端口 name 为 popup 用来标识是 popup 创建的连接
      const pm = new PortMessage(port) // 使用PortMessage来优化 port
      pm.listen((data) => { //监听事件同时，约定 method，用于调用 background 中的方法
        console.log("Received data from popup:", data, data.method)
        if (data.method) {
          console.log("Calling method:", data.method, walletMethods[data.method])
          return walletMethods[data.method].apply(null, data.params || {}) // 执行方法
        }
        return null
      })
      port.onDisconnect.addListener(() => {
        // 断开连接的处理。
        console.log("Popup disconnected")
      })
      return
    }
  })
}

init()

// let portFromCS;
// let browser = chrome || (window as any).browser; // 兼容性处理
// function connected(p) {
//   portFromCS = p; // 这个 p 就是一个 Port
//   portFromCS.postMessage({ greeting: "hi there content script!" });
//   portFromCS.onMessage.addListener((m) => {
//     console.log("In background script, received message from content script")
//     console.log(m.greeting);
//   });
// }

// browser.runtime.onConnect.addListener(connected); // 

// browser.action.onClicked.addListener(() => {
//   portFromCS.postMessage({ greeting: "they clicked the button!" });
// });
