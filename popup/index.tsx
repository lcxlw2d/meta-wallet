import React from "react";
import { Root } from "~components/Root";
import type { WalletService } from "~background/walletService"
import { getUIType } from "../utils/getUIType";
import { PortMessage } from "~utils/message"

const portMessageChannel = new PortMessage()
portMessageChannel.connect(getUIType());

export const wallet = new Proxy(
  {},
  {
    get(_, k) {
      return async (...params: any) => {
        try {
          // 获取钱包服务
          const res = await portMessageChannel.request({
            type: "controller",
            method: k,
            params
          })
          return res
        } catch (error) {
          Promise.reject(error)
          return {};
        }
      }
    }
  }
) as WalletService

export default function Popup() {
  return <Root />
}