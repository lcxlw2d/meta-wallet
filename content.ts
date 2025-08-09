export { }
const extensionApi = chrome;
// let myPort = extensionApi.runtime.connect({ name: "port-from-cs" });

// console.log(myPort);
// myPort.onMessage.addListener((m) => {
//   console.log("In content script, received message from background script: ");
//   console.log(m.greeting);
// });

// document.body.addEventListener("click", () => {
//   console.log("In content script, clicked the page");
//   myPort.postMessage({ greeting: "they clicked the page!" });
// });
let pt = extensionApi.runtime.connect({ name: "popup" });
// document.querySelector("#connectBtn")?.addEventListener("click", () => {
//   console.log("In content script, clicked the button");
//   pt.postMessage({
//     _type_: "ETH_WALLET_request", data: {
//       method: "helloWorld"
//     }
//   });
// });
const coreObj = {
  eth_requestAccounts: () => {
    pt.postMessage({
      _type_: "ETH_WALLET_request", data: {
        method: "eth_requestAccounts"
      }
    });
  }
}

function injectWalletObject() {
  const script = document.createElement("script")
  script.textContent = `
    window['myWallet'] = coreObj;
  `
  document.documentElement.appendChild(script)
  script.remove()
}

// 注入执行
injectWalletObject()