// 这个文件最终会被 content script 注入到网页
(() => {
  interface RequestPayload {
    method: string
    params?: unknown[]
  }

  interface WindowWithWallet extends Window {
    myWallet?: MyWallet
  }

  class MyWallet {
    public isMyWallet = true

    public request<T = unknown>(payload: RequestPayload): Promise<T> {
      return new Promise((resolve, reject) => {
        const id = `${Date.now()}-${Math.random()}`

        window.postMessage(
          {
            target: "mywallet-content",
            type: "MYWALLET_REQUEST",
            id,
            payload
          },
          "*"
        )

        const handler = (event: MessageEvent) => {
          if (event.source !== window) return
          if (event.data?.target !== "mywallet-injected") return
          if (event.data?.id !== id) return

          window.removeEventListener("message", handler)
          if (event.data.error) {
            reject(event.data.error)
          } else {
            resolve(event.data.result)
          }
        }

        window.addEventListener("message", handler)
      })
    }
  }

  ; (window as WindowWithWallet).myWallet = new MyWallet()
  console.log("✅ MyWallet injected to window")
})()
