export class PortMessage {

  port: chrome.runtime.Port = null
  private requestIdPool = [...Array(1000).keys()]
  protected EVENT_PREFIX = "ETH_WALLET_"
  protected listenCallback: any

  constructor(port?: chrome.runtime.Port) {
    if (port) {
      this.port = port
    }
  }

  private waitingMap = new Map<
    number,
    {
      data: any
      resolve: (arg: any) => any
      reject: (arg: any) => any
    }
  >() // 这里需要使用一个 map，同时返回一个 resolve 和 reject，通信使用 Promise 来管理，类似与请求 API 一样。
  listen = (listenCallback: any) => {
    if (!this.port) return
    this.listenCallback = listenCallback
    this.port.onMessage.addListener(({ _type_, data }) => {
      if (_type_ === `${this.EVENT_PREFIX}request`) {
        this.listenCallback(data)
      }
    })
    return this
  }
}
