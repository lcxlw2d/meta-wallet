export { }
console.log(
  "You may find that having is not so pleasing a thing as wanting. This is not logical, but it is often true."
)
// Use 'chrome' if 'browser' is not defined (for Chrome extensions)
const extensionApi = chrome;
let myPort = extensionApi.runtime.connect({ name: "port-from-cs" });
myPort.postMessage({ greeting: "hello from content script" });
console.log(myPort);
myPort.onMessage.addListener((m) => {
  console.log("In content script, received message from background script: ");
  console.log(m.greeting);
});

document.body.addEventListener("click", () => {
  console.log("In content script, clicked the page");
  myPort.postMessage({ greeting: "they clicked the page!" });
});
myPort.onDisconnect.addListener(() => {
  console.log("Port disconnected");
});
