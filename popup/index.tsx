import React, { useEffect } from "react"
import { Root } from "~components/Root";
import { setCurrentNetwork } from "../utils/storage"

export default function Popup() {
  useEffect(() => {
    const storedChain = localStorage.getItem("currentNetwork");
    if (storedChain) {
      setCurrentNetwork(storedChain);
    } else {
      setCurrentNetwork("sepolia"); // 设置当前网络为 Sepolia
    }
  }, [])
  return <Root />
}