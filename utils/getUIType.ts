const getUIType = () => {
  const url = window.location.href;
  if (url.includes("chrome-extension://")) {
    return "popup";
  } else if (url.includes("content-script")) {
    return "content";
  } else if (url.includes("background")) {
    return "background";
  } else {
    return "unknown";
  }
}

export { getUIType };